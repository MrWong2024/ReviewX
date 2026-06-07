import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (responseBody && typeof responseBody === 'object') {
        const maybeMessage = (responseBody as { message?: unknown }).message;

        if (typeof maybeMessage === 'string') {
          message = maybeMessage;
        } else if (Array.isArray(maybeMessage)) {
          message = maybeMessage.filter(Boolean).join('; ');
        }
      }
    } else if (exception instanceof Error && exception.message) {
      message = exception.message;
    }

    httpAdapter.reply(
      response,
      {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: String(httpAdapter.getRequestUrl(request)),
        message,
      },
      status,
    );
  }
}
