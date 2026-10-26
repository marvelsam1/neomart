import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Role, VerificationStatus } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ReviewVendorProfileDto } from './dto/review-vendor-profile.dto.js';
import { VendorsService } from './vendors.service.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('vendors')
export class VendorsAdminController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  findApplications() {
    return this.vendorsService.findApplications();
  }

  @Patch(':userId/verification')
  reviewApplication(
    @Param('userId') userId: string,
    @Body() dto: ReviewVendorProfileDto,
  ) {
    return this.vendorsService.reviewApplication(
      userId,
      dto.status as VerificationStatus,
    );
  }
}
