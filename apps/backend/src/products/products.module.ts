import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController, CategoriesController],
  providers: [ProductsService, CategoriesService],
  exports: [ProductsService],
})
export class ProductsModule {}
