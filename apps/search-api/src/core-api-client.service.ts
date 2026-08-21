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
}
