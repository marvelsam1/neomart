import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  create(dto: CreateCategoryDto) {
    const slug = dto.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description,
        image: dto.image,
      },
    });
  }
}
