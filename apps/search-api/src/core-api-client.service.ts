import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, lastValueFrom } from 'rxjs';

@Injectable()
export class CoreApiClientService {
  private readonly logger = new Logger(CoreApiClientService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async validateProject(
    projectId: string,
    authHeader?: string,
  ): Promise<boolean> {
    const apiUrl =
      this.configService.get<string>('API_URL') || 'http://localhost:4000';

    try {
      const headers: Record<string, string> = {};
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      await lastValueFrom(
        this.httpService
          .get(`${apiUrl}/projects/${projectId}`, { headers })
          .pipe(
            catchError((err: Error) => {
              this.logger.error(
                `Failed to validate project ${projectId}: ${err.message}`,
              );
              throw err;
            }),
          ),
      );

      return true;
    } catch {
      return false;
    }
  }

  async validateSuperAdmin(authHeader?: string): Promise<boolean> {
    if (!authHeader) return false;

    try {
      // Remove 'Bearer ' prefix if present
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');

      if (!secret) {
        this.logger.error(
          'JWT_ACCESS_SECRET is not configured for local verification.',
        );
        return false;
      }

      // Verify token locally without hitting the Core API
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, secret);

      return decoded?.role === 'SUPER_ADMIN';
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        this.logger.warn(`SUPER_ADMIN token expired`);
      } else {
        this.logger.error(
          `Failed to validate SUPER_ADMIN locally: ${err.message}`,
        );
      }
      return false;
    }
  }
}
