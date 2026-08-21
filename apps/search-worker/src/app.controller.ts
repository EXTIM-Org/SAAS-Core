import { Controller, Get, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Client } from 'typesense';

@Controller()
export class AppController {
  constructor(
    @Inject('TYPESENSE_CLIENT') private readonly typesenseClient: Client,
    @InjectQueue('default') private readonly queue: Queue,
  ) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('health')
  async getHealth() {
    let typesenseStatus: Record<string, unknown> | { ok: boolean };
    let redisStatus: Record<string, unknown> | { ok: boolean };

    try {
      typesenseStatus = await this.typesenseClient.health.retrieve();
    } catch (error) {
      typesenseStatus = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    try {
      const redisClient = await this.queue.defaultJobOptions;
      if (redisClient) {
        redisStatus = { ok: true };
      }
    } catch (error) {
      redisStatus = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    return {
      status: (!('error' in typesenseStatus) && !('error' in redisStatus)) ? 'ok' : 'error',
      typesense: typesenseStatus,
      redis: redisStatus,
    };
  }
}
