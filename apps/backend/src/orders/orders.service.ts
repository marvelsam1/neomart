import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const secretKey =
      process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLW_SECRET_KEY;
    if (!secretKey) {
      throw new ServiceUnavailableException(
        'Flutterwave payments are not configured. Please contact the marketplace.',
      );
    }

    const [user, existingAddress] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      }),
      dto.shippingAddressId
        ? this.prisma.address.findFirst({
            where: { id: dto.shippingAddressId, userId },
          })
        : Promise.resolve(null),
    ]);
    if (!user) throw new NotFoundException('Customer account not found.');
    if (dto.shippingAddressId && !existingAddress) {
      throw new NotFoundException(
        'Shipping address not found or does not belong to user.',
      );
    }

    let subtotal = 0;
    const orderItemsData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];
    const quantities = new Map<string, number>();
    for (const item of dto.items) {
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.quantity,
      );
    }

    for (const [productId, quantity] of quantities) {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product || !product.isActive) {
        throw new NotFoundException(
          `Product with ID ${productId} not found or inactive.`,
        );
      }
      if (product.stock < quantity) {
        throw new BadRequestException(
          `Insufficient stock for product: ${product.name}. Available: ${product.stock}.`,
        );
      }
      const itemTotal = Number(product.price) * quantity;
      subtotal += itemTotal;
      orderItemsData.push({
        productId: product.id,
        quantity,
        price: product.price,
      });
    }

    const shippingMethod = dto.shippingMethod ?? 'standard';
    const deliveryFee =
      shippingMethod === 'pickup'
        ? 0
        : shippingMethod === 'express'
          ? 5500
          : subtotal >= 50000
            ? 0
            : 2500;
    const discount =
      dto.couponCode?.trim().toUpperCase() === 'HOME10'
        ? Math.round(subtotal * 0.1)
        : 0;
    const totalAmount = Math.max(0, subtotal + deliveryFee - discount);
    const orderNumber = `#NM-${randomUUID().slice(0, 12).toUpperCase()}`;
    const paymentReference = `NM-${randomUUID().replace(/-/g, '')}`;
    const callbackUrl =
      `${process.env.STOREFRONT_URL ?? 'http://localhost:3000'}/checkout/verify`;

    const order = await this.prisma.$transaction(async (tx) => {
      const address =
        existingAddress ??
        (await tx.address.create({
          data: { ...dto.shippingAddress!, userId },
        }));
      for (const item of orderItemsData) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1) {
          throw new BadRequestException(
            'A product in your cart is no longer available in the requested quantity.',
          );
        }
      }
      return tx.order.create({
        data: {
          orderNumber,
          userId,
          shippingAddressId: address.id,
          totalAmount,
          deliveryFee,
          status: OrderStatus.PENDING,
          items: {
            create: orderItemsData,
          },
          transaction: {
            create: {
              reference: paymentReference,
              gateway: 'FLUTTERWAVE',
              status: 'PENDING',
              amount: totalAmount,
            },
          },
        },
        include: {
          items: { include: { product: true } },
          shippingAddress: true,
          transaction: true,
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    }, {
      maxWait: 10_000,
      timeout: 15_000,
    });

    try {
      const response = await fetch(
        'https://api.flutterwave.com/v3/payments',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tx_ref: paymentReference,
            amount: Number(totalAmount.toFixed(2)),
            currency: 'NGN',
            redirect_url: callbackUrl,
            customer: {
              email: user.email,
              name: order.shippingAddress.fullName,
              phonenumber: order.shippingAddress.phone,
            },
            meta: {
              orderId: order.id,
              orderNumber,
            },
          }),
        },
      );
      const result = (await response.json()) as {
        status?: string;
        message?: string;
        data?: { link?: string };
      };
      if (!response.ok || result.status !== 'success' || !result.data?.link) {
        throw new BadGatewayException(
          result.message ?? 'Flutterwave could not initialize this payment.',
        );
      }
      return {
        message: 'Order created. Continue to Flutterwave to complete payment.',
        order,
        paymentInitialization: {
          reference: paymentReference,
          amount: totalAmount,
          currency: 'NGN',
          callbackUrl,
          authorizationUrl: result.data.link,
        },
      };
    } catch (error) {
      await this.cancelUnpaidOrder(order.id, error);
      if (error instanceof BadGatewayException) throw error;
      throw new BadGatewayException(
        'Could not connect to Flutterwave. Your cart has not been charged; please try again.',
      );
    }
  }

  async verifyPayment(
    reference: string,
    transactionId: string | undefined,
    user: { id: string; role: Role },
  ) {
    const payment = await this.prisma.transaction.findUnique({
      where: { reference },
      include: { order: true },
    });
    if (!payment) throw new NotFoundException('Payment reference not found.');
    if (user.role === Role.CUSTOMER && payment.order.userId !== user.id) {
      throw new ForbiddenException('You do not have access to this payment.');
    }
    if (payment.status === 'SUCCESS') {
      return { message: 'Payment already verified.', order: payment.order };
    }
    if (payment.status !== 'PENDING') {
      throw new BadRequestException('This payment is no longer pending.');
    }

    const secretKey =
      payment.gateway === 'PAYSTACK'
        ? process.env.PAYSTACK_SECRET_KEY
        : process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLW_SECRET_KEY;
    if (!secretKey) {
      throw new ServiceUnavailableException(
        `${payment.gateway === 'PAYSTACK' ? 'Paystack' : 'Flutterwave'} payments are not configured.`,
      );
    }
    if (
      payment.gateway === 'FLUTTERWAVE' &&
      (!transactionId || !/^\d+$/.test(transactionId))
    ) {
      throw new BadRequestException(
        'Flutterwave transaction ID is missing from the payment return.',
      );
    }

    let response: Response;
    try {
      response = await fetch(
        payment.gateway === 'PAYSTACK'
          ? `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`
          : `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId!)}/verify`,
        { headers: { Authorization: `Bearer ${secretKey}` } },
      );
    } catch {
      throw new BadGatewayException(
        `Could not connect to ${payment.gateway === 'PAYSTACK' ? 'Paystack' : 'Flutterwave'} to verify payment.`,
      );
    }
    const result = (await response.json()) as {
      status?: boolean | string;
      message?: string;
      data?: {
        status?: string;
        reference?: string;
        tx_ref?: string;
        amount?: number | string;
        currency?: string;
      };
    };
    const requestSucceeded =
      payment.gateway === 'PAYSTACK'
        ? result.status === true
        : result.status === 'success';
    if (!response.ok || !requestSucceeded || !result.data) {
      throw new BadGatewayException(
        result.message ??
          `${payment.gateway === 'PAYSTACK' ? 'Paystack' : 'Flutterwave'} could not verify this payment.`,
      );
    }
    const verifiedReference =
      payment.gateway === 'PAYSTACK' ? result.data.reference : result.data.tx_ref;
    const verifiedAmount = Number(result.data.amount);
    const amountMatches =
      payment.gateway === 'PAYSTACK'
        ? verifiedAmount === Math.round(Number(payment.amount) * 100)
        : verifiedAmount >= Number(payment.amount);
    if (
      verifiedReference !== reference ||
      !amountMatches ||
      result.data.currency !== 'NGN'
    ) {
      throw new BadGatewayException(
        `${payment.gateway === 'PAYSTACK' ? 'Paystack' : 'Flutterwave'} returned payment details that do not match this order.`,
      );
    }

    const transactionSucceeded =
      payment.gateway === 'PAYSTACK'
        ? result.data.status === 'success'
        : result.data.status === 'successful';
    if (!transactionSucceeded) {
      await this.cancelUnpaidOrder(payment.orderId, result);
      throw new BadRequestException(
        `${payment.gateway === 'PAYSTACK' ? 'Paystack' : 'Flutterwave'} has not confirmed this payment.`,
      );
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.updateMany({
        where: { id: payment.id, status: 'PENDING' },
        data: {
          status: 'SUCCESS',
          paidAt: new Date(),
          rawResponse: JSON.stringify(result),
        },
      });
      if (updated.count === 0) {
        const current = await tx.order.findUniqueOrThrow({
          where: { id: payment.orderId },
        });
        return current;
      }
      return tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.PROCESSING },
        include: {
          items: { include: { product: true } },
          shippingAddress: true,
          transaction: true,
        },
      });
    });
    return { message: 'Payment verified successfully.', order };
  }

  async findAll(user: { id: string; role: Role }) {
    if (user.role === Role.CUSTOMER) {
      return this.prisma.order.findMany({
        where: { userId: user.id },
        include: {
          items: { include: { product: true } },
          transaction: true,
          shippingAddress: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === Role.VENDOR) {
      await this.assertApprovedVendor(user.id);
      const orders = await this.prisma.order.findMany({
        where: { items: { some: { product: { vendorId: user.id } } } },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          items: {
            where: { product: { vendorId: user.id } },
            include: {
              product: {
                include: {
                  vendor: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      vendorProfile: { select: { businessName: true } },
                    },
                  },
                },
              },
            },
          },
          transaction: true,
          shippingAddress: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return orders;
    }

    return this.prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                vendor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    vendorProfile: { select: { businessName: true } },
                  },
                },
              },
            },
          },
        },
        transaction: true,
        shippingAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: { id: string; role: Role }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        shippingAddress: true,
        transaction: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.role === Role.CUSTOMER && order.userId !== user.id) {
      throw new ForbiddenException('You do not have access to view this order');
    }

    return order;
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    user: { id: string; role: Role },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.role === Role.VENDOR) {
      await this.assertApprovedVendor(user.id);
      if (!order.items.some((item) => item.product.vendorId === user.id)) {
        throw new ForbiddenException('You can only update orders containing your products.');
      }
      if (order.items.some((item) => item.product.vendorId !== user.id)) {
        throw new ForbiddenException(
          'This order contains products from another seller and must be updated by marketplace support.',
        );
      }
    }

    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: { transaction: true },
    });
  }

  async updateItemStatus(
    orderId: string,
    itemId: string,
    status: OrderStatus,
    user: { id: string; role: Role },
  ) {
    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
      include: {
        order: { include: { transaction: true, items: true } },
        product: true,
      },
    });
    if (!item) throw new NotFoundException('Order item not found.');
    if (user.role === Role.VENDOR) {
      await this.assertApprovedVendor(user.id);
      if (item.product.vendorId !== user.id) {
        throw new ForbiddenException('You can only update fulfillment for your own products.');
      }
    }
    if (item.order.transaction?.status !== 'SUCCESS') {
      throw new BadRequestException('Only paid orders can be fulfilled.');
    }
    if (status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Vendors cannot cancel an order item.');
    }
    const allowedNextStatus: Record<OrderStatus, OrderStatus[]> = {
      PENDING: [OrderStatus.PROCESSING],
      PROCESSING: [OrderStatus.SHIPPED],
      SHIPPED: [OrderStatus.DELIVERED],
      DELIVERED: [],
      CANCELLED: [],
    };
    if (!allowedNextStatus[item.status].includes(status)) {
      throw new BadRequestException(
        `Order item cannot move from ${item.status} to ${status}.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.orderItem.update({ where: { id: item.id }, data: { status } });
      const items = await tx.orderItem.findMany({
        where: { orderId },
        include: { product: { select: { vendorId: true } } },
      });
      const nextOrderStatus =
        items.every((orderItem) => orderItem.status === OrderStatus.DELIVERED)
          ? OrderStatus.DELIVERED
          : items.some((orderItem) => orderItem.status === OrderStatus.SHIPPED)
            ? OrderStatus.SHIPPED
            : items.some((orderItem) => orderItem.status === OrderStatus.PROCESSING)
              ? OrderStatus.PROCESSING
              : OrderStatus.PENDING;
      return tx.order.update({
        where: { id: orderId },
        data: { status: nextOrderStatus },
        include: {
          items: { include: { product: true } },
          transaction: true,
          shippingAddress: true,
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, phone: true },
          },
        },
      });
    });
  }

  private async cancelUnpaidOrder(orderId: string, paymentResponse: unknown) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { transaction: true, items: true },
      });
      if (!order || order.transaction?.status !== 'PENDING') return;
      await tx.transaction.update({
        where: { id: order.transaction.id },
        data: {
          status: 'FAILED',
          rawResponse:
            paymentResponse instanceof Error
              ? paymentResponse.message
              : JSON.stringify(paymentResponse),
        },
      });
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
    });
  }

  private async assertApprovedVendor(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
      select: { verificationStatus: true },
    });
    if (profile?.verificationStatus !== 'APPROVED') {
      throw new ForbiddenException(
        'Your business profile must be verified before managing orders.',
      );
    }
  }
}
