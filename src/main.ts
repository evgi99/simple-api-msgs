import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cors from 'cors';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { DEFAULT_JWT_SECRET, URLENCODED_BODY_LIMIT } from './common/constants';

function validateProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === DEFAULT_JWT_SECRET) {
    throw new Error(
      'JWT_SECRET must be set to a secure value in production. Do not use the default.',
    );
  }
  if (!process.env.CORS_ORIGINS || process.env.CORS_ORIGINS.trim() === '') {
    throw new Error(
      'CORS_ORIGINS must be set in production (comma-separated list of allowed origins).',
    );
  }
}

function getCorsOrigin(): string | string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return '*';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

async function bootstrap() {
  validateProductionEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.use(helmet());
  app.use(cors({ origin: getCorsOrigin() }));

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: URLENCODED_BODY_LIMIT }));

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap application', err);
  process.exit(1);
});

