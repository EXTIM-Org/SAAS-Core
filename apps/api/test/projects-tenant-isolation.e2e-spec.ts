import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Projects - Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let tokenA: string;
  let tokenB: string;
  let projectAId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prisma = app.get(PrismaService);
    await app.init();

    // Setup: Create User A and User B
    const resA = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'user-a@example.com', password: 'password123' })
      .expect(201);
    tokenA = resA.body.accessToken;

    const resB = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'user-b@example.com', password: 'password123' })
      .expect(201);
    tokenB = resB.body.accessToken;

    // Create Project A
    const projectRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Project A' })
      .expect(201);
    projectAId = projectRes.body.id;
  });

  afterAll(async () => {
    // Clean up
    if (prisma) {
      await prisma.project.deleteMany();
      await prisma.user.deleteMany();
    }
    if (app) {
      await app.close();
    }
  });

  it('User B cannot read Project A (GET /projects/:id)', async () => {
    await request(app.getHttpServer())
      .get(`/projects/${projectAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404); // Not Found or 403 Forbidden is acceptable for tenant isolation
  });

  it('User B cannot update Project A (PATCH /projects/:id)', async () => {
    await request(app.getHttpServer())
      .patch(`/projects/${projectAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Hacked Project A' })
      .expect(404);
  });

  it('User B cannot delete Project A (DELETE /projects/:id)', async () => {
    await request(app.getHttpServer())
      .delete(`/projects/${projectAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it('Unauthenticated user cannot read Project A', async () => {
    await request(app.getHttpServer())
      .get(`/projects/${projectAId}`)
      .expect(401); // Unauthorized
  });
});
