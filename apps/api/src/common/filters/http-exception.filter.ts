import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (response.headersSent) {
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'حدث خطأ في الخادم';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const obj = exResponse as any;
        if (Array.isArray(obj.message)) {
          message = obj.message[0];
        } else {
          message = obj.message || obj.error || message;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      message = 'حدث خطأ في الخادم';
    }

    try {
      response.status(status).json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Response already sent or serialization error - ignore
    }
  }
}
