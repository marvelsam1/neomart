import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.CUSTOMER, Role.ADMIN)
  createOrder(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: { user: { id: string; role: Role } }) {
    return this.ordersService.findAll(req.user);
  }

  @Get('payment/verify/:reference')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  verifyPayment(
    @Param('reference') reference: string,
    @Query('transaction_id') transactionId: string | undefined,
    @Req() req: { user: { id: string; role: Role } },
  ) {
    return this.ordersService.verifyPayment(reference, transactionId, req.user);
  }

  @Patch(':id/items/:itemId/status')
  @Roles(Role.VENDOR, Role.ADMIN)
  updateItemStatus(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: { user: { id: string; role: Role } },
  ) {
    return this.ordersService.updateItemStatus(
      orderId,
      itemId,
      dto.status,
      req.user,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.findOne(id, req.user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: { user: { id: string; role: Role } },
  ) {
    return this.ordersService.updateStatus(id, dto.status, req.user);
  }
}
