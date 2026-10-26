import { IsEmail, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @Matches(/^\d{6}$/, { message: 'Reset code must contain 6 digits' })
  otp: string;

  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
}
