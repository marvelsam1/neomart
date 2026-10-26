import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  IsArray,
  IsOptional,
  IsBoolean,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ProductOptionDto {
  @IsNotEmpty()
  @IsString()
  label: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  values: string[];
}

export class CreateProductDto {
  @IsNotEmpty({ message: 'Product name is required' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber({}, { message: 'Price must be a valid number' })
  @IsPositive({ message: 'Price must be greater than zero' })
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsNumber({}, { message: 'Compare at price must be a valid number' })
  @IsPositive({ message: 'Compare at price must be greater than zero' })
  @Type(() => Number)
  compareAtPrice?: number;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsNotEmpty({ message: 'Stock quantity is required' })
  @IsInt({ message: 'Stock must be an integer' })
  @Min(0, { message: 'Stock cannot be negative' })
  @Type(() => Number)
  stock: number;

  @IsNotEmpty({ message: 'SKU is required' })
  @IsString()
  sku: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one product image is required' })
  @IsString({ each: true })
  images: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  details?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionDto)
  options?: ProductOptionDto[];

  @IsOptional()
  @IsString()
  originCity?: string;

  @IsNotEmpty({ message: 'Origin state is required (e.g., Abia, Oyo, Lagos)' })
  @IsString()
  originState: string;

  @IsOptional()
  @IsBoolean()
  isFlashSale?: boolean;

  @IsNotEmpty({ message: 'Category ID is required' })
  @IsString()
  categoryId: string;
}
