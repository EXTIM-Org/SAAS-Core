import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

// Using mock to prevent network connections during e2e tests for external services
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    defaultJobOptions: Promise.resolve({}),
    close: jest.fn().mockResolvedValue(true),
  })),
}));

jest.mock('typesense', () => ({
  Client: jest.fn().mockImplementation(() => ({
    health: {
      retrieve: jest.fn().mockResolvedValue({ ok: true }),
    },
    collections: jest.fn().mockReturnValue({
      retrieve: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
      documents: jest.fn().mockReturnValue({
        search: jest.fn().mockResolvedValue({ hits: [] }),
      }),
    }),
  })),
}));

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider('TYPESENSE_CLIENT')
    .useValue({
        health: { retrieve: jest.fn().mockResolvedValue({ ok: true }) },
        collections: jest.fn().mockReturnValue({
            retrieve: jest.fn().mockResolvedValue({}),
        })
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request.default(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
