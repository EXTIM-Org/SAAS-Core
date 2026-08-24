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

  async sendOrderInvoiceEmail(
    userEmail: string,
    order: { id: string; totalAmount: number; createdAt: Date },
    orderItems: { name: string; quantity: number; price: number }[],
  ): Promise<void> {
    const from =
      this.configService.get<string>('SMTP_FROM') || 'noreply@example.com';
    const subject = `Order Receipt - ${order.id}`;

    const itemsHtml = orderItems
      .map(
        (item) =>
          `<li>${item.name} (x${item.quantity}) - $${item.price.toFixed(2)}</li>`,
      )
      .join('');

    const html = `
      <h1>Thank you for your purchase</h1>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Purchase Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
      <h2>Items:</h2>
      <ul>${itemsHtml}</ul>
      <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
    `;

    if (!this.transporter) {
      this.logger.log(
        `[Mock Email] To: ${userEmail}, Subject: ${subject}, HTML: ${html}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from,
        to: userEmail,
        subject,
        html,
      });
      this.logger.log(`Invoice email sent to ${userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send invoice email to ${userEmail}`, error);
      // We explicitly do not throw the error to ensure we don't crash or block
      // the caller (e.g. checkout process) if email sending fails.
    }
  }
}
