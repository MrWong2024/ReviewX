import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const DEFAULT_CORS_ORIGIN = 'http://localhost:3001';

function resolveCorsOrigin(corsOriginValue: string): boolean | string[] {
  if (corsOriginValue.trim() === '*') {
    return true;
  }

  const origins = corsOriginValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : [DEFAULT_CORS_ORIGIN];
}

export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const corsOriginValue =
    configService.get<string>('app.corsOrigin') ?? DEFAULT_CORS_ORIGIN;

  app.enableCors({
    credentials: true,
    origin: resolveCorsOrigin(corsOriginValue),
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(app.get(AllExceptionsFilter));
}
