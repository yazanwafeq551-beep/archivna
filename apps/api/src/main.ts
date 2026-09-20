import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SnakeToCamelInterceptor } from './common/interceptors/snake-to-camel.interceptor';
import { CamelToSnakePipe } from './common/pipes/camel-to-snake.pipe';
import { PrismaService } from './prisma/prisma.service';

/**
 * The example secrets are fine for local work but must never reach production -
 * anyone holding them can mint valid tokens.
 */
function assertProductionSecrets() {
  if (process.env.NODE_ENV !== 'production') return;

  const weak = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].filter((key) => {
    const value = process.env[key];
    return !value || value.length < 32 || value.includes('change-in-production');
  });

  if (weak.length > 0) {
    throw new Error(
      `Refusing to start: ${weak.join(', ')} must be set to a strong value in production`,
    );
  }
}

async function bootstrap() {
  assertProductionSecrets();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const prisma = app.get(PrismaService);
  app.use(async (req, res, next) => {
    if (!req.path.startsWith('/uploads/')) return next();
    const file = await prisma.archiveFile.findFirst({
      where: { secure_url: req.path },
      select: {
        archive_record: {
          select: { status: true, access_level: true },
        },
      },
    });
    if (file && (file.archive_record.status !== 'published' || file.archive_record.access_level !== 'public')) {
      return res.status(403).json({ message: 'يجب الوصول إلى الملف من خلال المسار الآمن' });
    }
    return next();
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    // FRONTEND_URL may list several origins (production, previews, and the
    // packaged app, which sends https://localhost on Android and
    // capacitor://localhost on iOS).
    origin: (process.env.FRONTEND_URL || 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client'],
    // A preflight before every request costs a round trip on a phone that
    // may be on mobile data; a day is the longest Chrome will honour.
    maxAge: 86400,
  });

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // Behind a reverse proxy the client IP arrives in X-Forwarded-For; without
  // this every visitor shares one rate-limit bucket.
  app.set('trust proxy', 1);

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: Number(process.env.RATE_LIMIT_MAX || 600),
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: 429,
        message: 'لقد تجاوزت الحد الأقصى من الطلبات، يرجى المحاولة لاحقاً',
      },
    }),
  );

  // Only the credential endpoints get the strict budget. Session upkeep
  // (/auth/refresh, /auth/me) runs on every page load and must not be throttled
  // into logging the user out.
  const credentialLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
      statusCode: 429,
      message:
        'لقد تجاوزت الحد الأقصى من محاولات تسجيل الدخول، يرجى المحاولة لاحقاً',
    },
  });

  for (const path of [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/auth/change-password',
  ]) {
    app.use(path, credentialLimiter);
  }

  app.use(cookieParser());

  app.useGlobalPipes(
    new CamelToSnakePipe(),
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new SnakeToCamelInterceptor());

  const config = new DocumentBuilder()
    .setTitle('أرشيفنا API')
    .setDescription('API for Palestinian Digital Archive - أرشيفنا')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
