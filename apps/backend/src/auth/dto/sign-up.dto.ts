import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
} from 'class-validator';

export class SignUpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
