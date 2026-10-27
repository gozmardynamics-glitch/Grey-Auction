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
import { StructuredLoggerService } from './common/logger/structured-logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Required for webhook signature verification (payment gateways)
    // G50 — silence the default console logger; the app-wide structured
    // logger below owns all output (JSON when LOG_FORMAT=json / prod).
    bufferLogs: true,
  });
  app.useLogger(app.get(StructuredLoggerService));
  app.flushLogs();

  app.use(helmet());
  app.use(compression());

  /**
   * Proxy awareness.
   *
   * In production this app always sits behind something that terminates TLS
   * (Cloudflare, a load balancer, Coolify's Traefik). Express then reports the
   * *proxy's* address as `req.ip`, which would (a) give every visitor the same
   * rate-limit bucket — one noisy client starves everyone — and (b) write the
   * proxy into the audit trail instead of the caller.
   *
   * TRUST_PROXY accepts Express's forms: a hop count ("1", "2"), "true"/"false",
   * or a comma-separated subnet list. Production defaults to one hop; set
   * TRUST_PROXY=2 when Cloudflare sits in front of another load balancer.
   */
  const trustProxy = process.env.TRUST_PROXY ?? (process.env.NODE_ENV === 'production' ? '1' : '');
  if (trustProxy && trustProxy !== 'false') {
    const value = /^\d+$/.test(trustProxy)
      ? Number(trustProxy)
      : trustProxy === 'true'
        ? 1
        : trustProxy;
    app.set('trust proxy', value);
  }
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
