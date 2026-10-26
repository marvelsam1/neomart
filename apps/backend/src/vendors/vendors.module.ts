import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { VendorsController } from './vendors.controller.js';
import { VendorsAdminController } from './vendors-admin.controller.js';
import { VendorsService } from './vendors.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [VendorsController, VendorsAdminController],
  providers: [VendorsService],
})
export class VendorsModule {}
