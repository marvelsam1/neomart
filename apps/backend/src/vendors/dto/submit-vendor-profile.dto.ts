import { BusinessType } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SubmitVendorProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  businessName: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1200)
  description: string;

  @IsOptional()
  @IsEmail()
  businessEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  businessPhone?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  addressLine: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

  @IsBoolean()
  verificationAcknowledged: boolean;
}
