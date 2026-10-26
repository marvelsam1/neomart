import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignInDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
