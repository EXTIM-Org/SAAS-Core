import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(exception);
      } else {
        this.logger.error(
          `[SentryFilter] Unhandled exception: ${exception}`,
          (exception as Error)?.stack,
        );
      }
    }

    if (response && typeof response.status === 'function') {
      const errorResponse: any = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      if (exception instanceof HttpException) {
        const httpResponse = exception.getResponse();
        if (typeof httpResponse === 'object' && httpResponse !== null) {
          Object.assign(errorResponse, httpResponse);
        } else {
          errorResponse.message = httpResponse;
        }
      } else if (exception instanceof Error) {
        errorResponse.message = exception.message;
      }

      response.status(status).json(errorResponse);
    }
  }
}
