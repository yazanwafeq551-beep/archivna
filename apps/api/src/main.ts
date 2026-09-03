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

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  app.use(helmet());

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      message: {
        statusCode: 429,
        message: 'لقد تجاوزت الحد الأقصى من الطلبات، يرجى المحاولة لاحقاً',
      },
    }),
  );

  app.use(
    '/api/v1/auth',
    rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      message: {
        statusCode: 429,
        message:
          'لقد تجاوزت الحد الأقصى من محاولات تسجيل الدخول، يرجى المحاولة لاحقاً',
      },
    }),
  );

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
