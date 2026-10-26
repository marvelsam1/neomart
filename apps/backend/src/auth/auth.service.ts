import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async signUp(dto: SignUpDto) {
    return this.createAccount(dto, Role.CUSTOMER);
  }

  async signUpVendor(dto: SignUpDto) {
    return this.createAccount(dto, Role.VENDOR);
  }

  private async createAccount(dto: SignUpDto, role: Role) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      message:
        role === Role.VENDOR
          ? 'Seller account created successfully'
          : 'Account created successfully',
      user,
      accessToken: token,
    };
  }

  async signIn(dto: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user.id, user.email, user.role);
    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken: token,
    };
  }

  async requestPasswordReset(dto: ForgotPasswordDto) {
    const genericResponse = {
      message:
        'If an account exists for this email, a reset code will be sent.',
    };
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true },
    });
    if (!user) return genericResponse;

    const recentRequests = await this.prisma.passwordResetOtp.count({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recentRequests >= 3) return genericResponse;

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.passwordResetOtp.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    const resetOtp = await this.prisma.passwordResetOtp.create({
      data: { userId: user.id, codeHash, expiresAt },
    });

    try {
      await this.emailService.sendPasswordResetCode(user.email, code);
    } catch (error) {
      await this.prisma.passwordResetOtp.delete({ where: { id: resetOtp.id } });
      console.error('Password reset email could not be delivered.', error);
      throw new ServiceUnavailableException(
        'Password reset email is temporarily unavailable. Please try again later.',
      );
    }

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (!user) {
      throw new BadRequestException(
        'The reset code is invalid or has expired.',
      );
    }

    const resetOtp = await this.prisma.passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!resetOtp || !(await bcrypt.compare(dto.otp, resetOtp.codeHash))) {
      throw new BadRequestException(
        'The reset code is invalid or has expired.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetOtp.updateMany({
        where: {
          id: resetOtp.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) {
        throw new BadRequestException(
          'The reset code is invalid or has expired.',
        );
      }
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    });

    return { message: 'Your password has been reset. You can now sign in.' };
  }

  private generateToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }
}
