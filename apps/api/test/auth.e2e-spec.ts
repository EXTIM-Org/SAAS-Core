import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Clean up
    if (prisma) {
      await prisma.user.deleteMany();
    }
    if (app) {
      await app.close();
    }
  });

  it('/auth/signup (POST) - success', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'test-signup@example.com', password: 'password123' })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('access_token');
    expect(typeof res.body.accessToken).toBe('string');
  });

  it('/auth/login (POST) - success', async () => {
    // Ensure user exists
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'test-login@example.com', password: 'password123' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test-login@example.com', password: 'password123' })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('access_token');
    expect(typeof res.body.accessToken).toBe('string');
  });
});
