import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

type ErrorResponseBody = {
  error?: string;
  message?: string | string[];
  statusCode?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toErrorResponseBody(value: unknown): ErrorResponseBody | null {
  if (!isRecord(value)) {
    return null;
  }

  const responseBody: ErrorResponseBody = {};

  if (typeof value.message === 'string' || Array.isArray(value.message)) {
    responseBody.message = value.message;
  }

  if (typeof value.error === 'string') {
    responseBody.error = value.error;
  }

  if (typeof value.statusCode === 'number') {
    responseBody.statusCode = value.statusCode;
  }

  return responseBody;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<unknown>();
    const request = ctx.getRequest<unknown>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
      } else {
        const parsedResponseBody = toErrorResponseBody(responseBody);

        if (typeof parsedResponseBody?.message === 'string') {
          message = parsedResponseBody.message;
        } else if (Array.isArray(parsedResponseBody?.message)) {
          message = parsedResponseBody.message
            .filter((item): item is string => typeof item === 'string')
            .join('; ');
        } else if (typeof parsedResponseBody?.error === 'string') {
          message = parsedResponseBody.error;
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
