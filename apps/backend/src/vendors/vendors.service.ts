import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { SubmitVendorProfileDto } from './dto/submit-vendor-profile.dto.js';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  findProfile(userId: string) {
    return this.prisma.vendorProfile.findUnique({ where: { userId } });
  }

  findApplications() {
    return this.prisma.vendorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findCustomers(userId: string) {
    const profile = await this.findProfile(userId);
    if (profile?.verificationStatus !== 'APPROVED') {
      throw new ForbiddenException(
        'Your business profile must be verified before viewing customers.',
      );
    }

    const orders = await this.prisma.order.findMany({
      where: { items: { some: { product: { vendorId: userId } } } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isVerified: true,
            createdAt: true,
          },
        },
        items: {
          where: { product: { vendorId: userId } },
          select: { quantity: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const customers = new Map<
      string,
      {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        role: string;
        isVerified: boolean;
        createdAt: Date;
        _count: { orders: number; products: number };
      }
    >();

    for (const order of orders) {
      const customer = customers.get(order.userId);
      if (customer) {
        customer._count.orders += 1;
        continue;
      }
      customers.set(order.userId, {
        ...order.user,
        _count: { orders: 1, products: 0 },
      });
    }

    return Array.from(customers.values());
  }

  async reviewApplication(userId: string, status: VerificationStatus) {
    const profile = await this.findProfile(userId);
    if (!profile) {
      throw new NotFoundException('Vendor application not found.');
    }

    return this.prisma.vendorProfile.update({
      where: { userId },
      data: { verificationStatus: status, reviewedAt: new Date() },
    });
  }

  async submitProfile(userId: string, dto: SubmitVendorProfileDto) {
    if (!dto.verificationAcknowledged) {
      throw new BadRequestException(
        'Please confirm that your business details are accurate.',
      );
    }

    const existingProfile = await this.findProfile(userId);
    if (existingProfile?.verificationStatus === 'APPROVED') {
      throw new ConflictException('This business profile is already verified.');
    }

    const {
      verificationAcknowledged: _verificationAcknowledged,
      ...profileData
    } = dto;
    return this.prisma.vendorProfile.upsert({
      where: { userId },
      create: {
        ...profileData,
        userId,
        verificationStatus: 'PENDING',
      },
      update: {
        ...profileData,
        verificationStatus: 'PENDING',
        submittedAt: new Date(),
        reviewedAt: null,
      },
    });
  }
}
