import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsOptional,
  IsIn,
  ValidateIf,
  ArrayMinSize,
  IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';

class ShippingAddressDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  state: string;
}

class OrderItemDto {
  @IsNotEmpty({ message: 'Product ID is required' })
  @IsString()
  productId: string;

  @IsNotEmpty({ message: 'Quantity is required' })
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Type(() => Number)
  quantity: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  shippingAddressId?: string;

  @ValidateIf((dto: CreateOrderDto) => !dto.shippingAddressId)
  @IsDefined()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsIn(['standard', 'express', 'pickup'])
  shippingMethod?: 'standard' | 'express' | 'pickup';

  @IsOptional()
  @IsString()
  couponCode?: string;
}
