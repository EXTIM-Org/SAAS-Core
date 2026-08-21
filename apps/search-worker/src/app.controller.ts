import { Controller, Get, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Client } from 'typesense';

@Controller()
export class AppController {
  constructor(
    @Inject('TYPESENSE_CLIENT') private readonly typesenseClient: Client,
    @InjectQueue('crawl-queue') private readonly queue: Queue,
  ) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('health')
  async getHealth() {
    let typesenseStatus: Record<string, unknown> | { ok: boolean };
    let redisStatus: Record<string, unknown> | { ok: boolean } = { ok: false };

    try {
      typesenseStatus = await this.typesenseClient.health.retrieve();
    } catch (error) {
      typesenseStatus = {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = await (this.queue as any).client;
      if (client && client.status === 'ready') {
        redisStatus = { ok: true };
      }
    } catch (error) {
      redisStatus = {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return {
      status:
        !('error' in typesenseStatus) && !('error' in redisStatus)
          ? 'ok'
          : 'error',
      typesense: typesenseStatus,
      redis: redisStatus,
    };
  }
}
