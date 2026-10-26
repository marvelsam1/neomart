import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  async sendPasswordResetCode(email: string, code: string) {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM;

    if (!host || !user || !password || !from) {
      throw new ServiceUnavailableException(
        'SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM must be configured.',
      );
    }

    const port = Number(process.env.SMTP_PORT ?? 587);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new ServiceUnavailableException('SMTP_PORT is invalid.');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass: password },
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Your Neomart password reset code',
      text: `Your password reset code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
      html: `<p>Your Neomart password reset code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`,
    });
  }
}
