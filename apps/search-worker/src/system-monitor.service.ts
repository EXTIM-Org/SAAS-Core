import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import pidusage from 'pidusage';
import Redis from 'ioredis';
import * as os from 'os';

@Injectable()
export class SystemMonitorService {
  private readonly logger = new Logger(SystemMonitorService.name);
  private redis: Redis;
  private previousCpuInfo = this.getCpuInfo();

  constructor(private configService: ConfigService) {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ||
      this.configService.get<string>('REDIS_URL_DOCKER') ||
      'redis://127.0.0.1:6379';
    this.redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
    this.redis.on('error', (err) => this.logger.error('Redis error', err));
  }

  private getCpuInfo() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        total += cpu.times[type as keyof typeof cpu.times];
      }
      idle += cpu.times.idle;
    }
    return { idle, total };
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleCron() {
    try {
      const stats = await pidusage(process.pid);

      // System CPU calculation
      const currentCpuInfo = this.getCpuInfo();
      const idleDifference = currentCpuInfo.idle - this.previousCpuInfo.idle;
      const totalDifference = currentCpuInfo.total - this.previousCpuInfo.total;
      const sysCpuPercentage = totalDifference === 0 ? 0 : 100 - (100 * idleDifference / totalDifference);
      this.previousCpuInfo = currentCpuInfo;

      // System Memory calculation
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const sysMemPercentage = (usedMem / totalMem) * 100;

      const payload = {
        // Process metrics
        cpu: stats.cpu, // process CPU percentage (from 0 to 100*vcore)
        memory: stats.memory, // process memory in bytes
        
        // System metrics
        systemCpu: sysCpuPercentage,
        systemMemoryUsed: usedMem,
        systemMemoryTotal: totalMem,
        systemMemoryPercent: sysMemPercentage,
        
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
