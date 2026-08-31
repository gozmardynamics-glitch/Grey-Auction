import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Module, Controller, Get, Post, Body } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import request = require('supertest');
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { RequestIdMiddleware } from '../src/common/middleware/request-id.middleware';
import { HealthController } from '../src/health/health.controller';

/** Sample DTO to exercise the global ValidationPipe. */
class CreateThingDto {
  @IsEmail() email: string;
  @IsString() @MinLength(3) name: string;
}

/** Tiny controller for exercising the HTTP layer without a DB. */
@Controller('things')
class TestThingsController {
  @Get('ok')
  ok() {
    return { success: true, message: 'ok' };
  }

  @Post()
  create(@Body() dto: CreateThingDto) {
    return { success: true, data: dto };
  }
}

@Module({ controllers: [HealthController, TestThingsController] })
class E2eTestModule {}

/**
 * HTTP-layer smoke test (no DB). Verifies:
 *  - X-Request-Id is attached to every response (success + error).
 *  - The global ValidationPipe rejects invalid payloads.
 *  - The AllExceptionsFilter shapes errors into a consistent envelope.
 *  - The liveness probe returns 200.
 */
describe('App HTTP layer (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [E2eTestModule],
    }).compile();

    app = module.createNestApplication();
    const reqIdMiddleware = new RequestIdMiddleware();
    app.use(reqIdMiddleware.use.bind(reqIdMiddleware));
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns ok with request-id', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('ok');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('positive case: valid POST passes validation', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/things')
      .send({ email: 'a@b.com', name: 'widget' })
      .expect(201);
    expect(res.body.data.email).toBe('a@b.com');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('validation: invalid email is rejected with 400 envelope', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/things')
      .send({ email: 'not-an-email', name: 'w' })
      .expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(400);
    expect(Array.isArray(res.body.message)).toBe(true);
    expect(res.body.requestId).toBeDefined();
    expect(res.headers['x-request-id']).toBe(res.body.requestId);
  });

  it('unknown route returns 404', async () => {
    const res = await request(app.getHttpServer()).get('/api/nope').expect(404);
    expect(res.body.success).toBe(false);
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('propagates an inbound x-request-id', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .set('x-request-id', 'trace-123')
      .expect(200);
    expect(res.headers['x-request-id']).toBe('trace-123');
  });
});