import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import pidusage from 'pidusage';
import Redis from 'ioredis';

@Injectable()
export class SystemMonitorService {
  private readonly logger = new Logger(SystemMonitorService.name);
  private redis: Redis;

  constructor(private configService: ConfigService) {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ||
      this.configService.get<string>('REDIS_URL_DOCKER') ||
      'redis://127.0.0.1:6379';
    this.redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
    this.redis.on('error', (err) => this.logger.error('Redis error', err));
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleCron() {
    try {
      const stats = await pidusage(process.pid);

      const payload = {
        cpu: stats.cpu, // percentage (from 0 to 100*vcore)
        memory: stats.memory, // bytes
        timestamp: new Date().toISOString(),
      };

      // Set key with 15 second expiration in case worker dies
      await this.redis.set(
        'worker:system:stats',
        JSON.stringify(payload),
        'EX',
        15,
      );
    } catch (err) {
      this.logger.error('Failed to report system stats', err);
    }
  }
}
