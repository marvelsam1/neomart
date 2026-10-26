import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto, vendorId?: string) {
    if (vendorId) await this.assertApprovedVendor(vendorId);
    if (dto.compareAtPrice !== undefined && dto.compareAtPrice <= dto.price) {
      throw new BadRequestException(
        'Compare-at price must be higher than the current price.',
      );
    }

    const existingSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });

    if (existingSku) {
      throw new ConflictException(`Product with SKU ${dto.sku} already exists`);
    }

    const images = this.normalizeImages(dto.images);
    if (images.length === 0) {
      throw new BadRequestException(
        'At least one valid product image is required.',
      );
    }
    const slug = `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const product = await this.prisma.product.create({
      data: {
        ...dto,
        images,
        slug,
        vendorId: vendorId || null,
        options: dto.options?.map((option) => ({
          label: option.label,
          values: option.values,
        })),
      },
      include: {
        category: true,
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            vendorProfile: { select: { businessName: true } },
          },
        },
      },
    });
    return this.normalizeProduct(product);
  }

  async findAll(query: ProductQueryDto) {
    const { search, categoryId, originState, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (originState) {
      where.originState = { equals: originState, mode: 'insensitive' };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              vendorProfile: { select: { businessName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((product) => this.normalizeProduct(product)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findVendorProducts(vendorId?: string) {
    if (vendorId) await this.assertApprovedVendor(vendorId);
    const where = vendorId ? { vendorId } : {};
    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            vendorProfile: { select: { businessName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      data: products.map((product) => this.normalizeProduct(product)),
      meta: { total: products.length },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        vendor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.normalizeProduct(product);
  }

  async update(
    id: string,
    dto: Partial<CreateProductDto>,
    user: { id: string; role: Role },
  ) {
    const product = await this.findOne(id);
    if (user.role === Role.VENDOR) {
      await this.assertApprovedVendor(user.id);
      if (product.vendorId !== user.id) {
        throw new ForbiddenException('You can only update your own products.');
      }
    }

    const { options, ...productFields } = dto;
    const images = dto.images ? this.normalizeImages(dto.images) : undefined;
    if (images && images.length === 0) {
      throw new BadRequestException(
        'At least one valid product image is required.',
      );
    }
    const data: Prisma.ProductUncheckedUpdateInput = {
      ...productFields,
      ...(images ? { images } : {}),
      options: options?.map((option) => ({
        label: option.label,
        values: option.values,
      })),
    };

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
    return this.normalizeProduct(updatedProduct);
  }

  async remove(id: string, user: { id: string; role: Role }) {
    const product = await this.findOne(id);
    if (user.role === Role.VENDOR) {
      await this.assertApprovedVendor(user.id);
      if (product.vendorId !== user.id) {
        throw new ForbiddenException('You can only remove your own products.');
      }
    }

    // Soft delete by setting isActive to false
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async assertApprovedVendor(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
      select: { verificationStatus: true },
    });
    if (profile?.verificationStatus !== 'APPROVED') {
      throw new ForbiddenException(
        'Your business profile must be verified before managing products.',
      );
    }
  }

  private normalizeImages(images: string[]) {
    return images
      .map((image) => image.trim().replace(/^["']+|["']+$/g, ''))
      .filter(Boolean);
  }

  private normalizeProduct<T extends { images: string[] }>(product: T): T {
    return { ...product, images: this.normalizeImages(product.images) };
  }
}
