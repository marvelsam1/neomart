import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('vendor-signup')
  async signUpVendor(@Body() dto: SignUpDto) {
    return this.authService.signUpVendor(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async requestPasswordReset(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
