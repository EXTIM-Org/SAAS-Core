import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host) {
      this.logger.warn(
        'SMTP_HOST is missing. Email service will run in mock mode.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendWelcomeEmail(to: string, email: string): Promise<void> {
    const from =
      this.configService.get<string>('SMTP_FROM') || 'noreply@example.com';
    const subject = 'Welcome to our platform!';
    const html = `<h1>Welcome ${email}!</h1><p>We are glad to have you on board.</p>`;

    if (!this.transporter) {
      this.logger.log(
        `[Mock Email] To: ${to}, Subject: ${subject}, HTML: ${html}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}`, error);
      throw error;
    }
  }
}
