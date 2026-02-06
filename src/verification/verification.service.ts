import { Injectable, BadRequestException } from '@nestjs/common';
import { Resend } from 'resend';

interface StoredCode {
  code: string;
  expiresAt: number;
}

@Injectable()
export class VerificationService {
  private codes = new Map<string, StoredCode>();
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendVerificationCode(email: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    this.codes.set(email, { code, expiresAt });

    await this.resend.emails.send({
      from: 'Boxful <onboarding@resend.dev>',
      to: email,
      subject: 'Código de verificación - Boxful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #333; margin-bottom: 16px;">Tu código de verificación</h2>
          <p style="color: #555; font-size: 16px;">
            Usa este código para completar tu registro en Boxful:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">
              ${code}
            </span>
          </div>
          <p style="color: #999; font-size: 14px;">
            Este código expira en 10 minutos.
          </p>
        </div>
      `,
    });

    return { message: 'Código de verificación enviado' };
  }

  verifyCode(email: string, code: string) {
    // Código maestro para desarrollo - siempre válido
    if (code === '000000') {
      console.log('✓ Código maestro usado para desarrollo');
      return { message: 'Email verificado correctamente' };
    }

    const stored = this.codes.get(email);

    if (!stored) {
      throw new BadRequestException('No se encontró un código para este email');
    }

    if (Date.now() > stored.expiresAt) {
      this.codes.delete(email);
      throw new BadRequestException('El código ha expirado');
    }

    if (stored.code !== code) {
      throw new BadRequestException('Código inválido');
    }

    this.codes.delete(email);
    return { message: 'Email verificado correctamente' };
  }
}
