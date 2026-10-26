import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN)
  @Get('vendor/me')
  findVendorProducts(
    @Req() req: { user: { id: string; role: Role } },
  ) {
    const vendorId = req.user.role === Role.VENDOR ? req.user.id : undefined;
    return this.productsService.findVendorProducts(vendorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Post()
  create(
    @Body() dto: CreateProductDto,
    @Req() req: { user: { id: string; role: Role } },
  ) {
    const vendorId = req.user.role === 'VENDOR' ? req.user.id : undefined;
    return this.productsService.create(dto, vendorId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProductDto>,
    @Req() req: { user: { id: string; role: Role } },
  ) {
    return this.productsService.update(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: { user: { id: string; role: Role } },
  ) {
    return this.productsService.remove(id, req.user);
  }
}
