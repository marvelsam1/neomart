import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { SubmitVendorProfileDto } from './dto/submit-vendor-profile.dto.js';
import { VendorsService } from './vendors.service.js';

type AuthenticatedVendorRequest = { user: { id: string } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.VENDOR)
@Controller('vendors/me')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get('profile')
  findProfile(@Req() request: AuthenticatedVendorRequest) {
    return this.vendorsService.findProfile(request.user.id);
  }

  @Get('customers')
  findCustomers(@Req() request: AuthenticatedVendorRequest) {
    return this.vendorsService.findCustomers(request.user.id);
  }

  @Post('profile')
  submitProfile(
    @Req() request: AuthenticatedVendorRequest,
    @Body() dto: SubmitVendorProfileDto,
  ) {
    return this.vendorsService.submitProfile(request.user.id, dto);
  }
}
