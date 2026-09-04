import { NestFactory } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as compression from 'compression';
import { json } from 'express';
import { resolve } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Required for webhook signature verification (payment gateways)
  });

  app.use(helmet());
  app.use(compression());
  // Capture the raw body for webhook signature verification (Paystack, Flutterwave, etc.)
  app.use(
    json({
      limit: '5mb',
      verify: (req: any, _res, buf) => {
        (req as any).rawBody = buf;
      },
    }),
  );

  // Serve locally-stored uploads (LocalStorageDriver). With STORAGE_DRIVER=s3
  // (MinIO/R2), files are served directly from the object store and this
  // route is unused.
  app.useStaticAssets(resolve(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  app.enableShutdownHooks();

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
  // Honor @Exclude() on entities (User.passwordHash/OTP state) in every JSON
  // response — belt-and-braces against accidentally serializing secrets.
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger docs are disabled in production to avoid exposing the API surface.
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('GreyAuction API')
      .setDescription('GreyAuction platform REST API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication & registration')
      .addTag('Products', 'Auction listings')
      .addTag('Bids', 'Bidding operations')
      .addTag('Orders', 'Post-auction order management')
      .addTag('Payments', 'Payment processing & webhooks')
      .addTag('Wallet', 'Digital wallet operations')
      .addTag('Exchange Rates', 'Multi-currency rates')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: 'api/docs-json' });
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`GreyAuction API running on http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
