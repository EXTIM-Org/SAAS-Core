import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import pidusage from 'pidusage';
import Redis from 'ioredis';
import * as os from 'os';
import checkDiskSpace from 'check-disk-space';
import * as si from 'systeminformation';

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

      // System Storage calculation
      const diskPath = process.platform === 'win32' ? 'C:/' : '/';
      let sysStorageTotal = 0;
      let sysStorageUsed = 0;
      let sysStoragePercent = 0;
      try {
        const diskSpace = await checkDiskSpace(diskPath);
        sysStorageTotal = diskSpace.size;
        sysStorageUsed = diskSpace.size - diskSpace.free;
        sysStoragePercent = diskSpace.size ? (sysStorageUsed / diskSpace.size) * 100 : 0;
      } catch (err) {
        this.logger.error(`Failed to check disk space for ${diskPath}`, err);
      }

      // System Swap calculation
      let sysSwapTotal = 0;
      let sysSwapUsed = 0;
      let sysSwapPercent = 0;
      try {
        const memData = await si.mem();
        sysSwapTotal = memData.swaptotal;
        sysSwapUsed = memData.swapused;
        sysSwapPercent = sysSwapTotal ? (sysSwapUsed / sysSwapTotal) * 100 : 0;
      } catch (err) {
        this.logger.error('Failed to get swap info', err);
      }

      const payload = {
        // Process metrics
        cpu: stats.cpu, // process CPU percentage (from 0 to 100*vcore)
        memory: stats.memory, // process memory in bytes
        
        // System metrics
        systemCpu: sysCpuPercentage,
        systemMemoryTotal: totalMem,
        systemMemoryUsed: usedMem,
        systemMemoryPercent: sysMemPercentage,
        systemStorageTotal: sysStorageTotal,
        systemStorageUsed: sysStorageUsed,
        systemStoragePercent: sysStoragePercent,
        systemSwapTotal: sysSwapTotal,
        systemSwapUsed: sysSwapUsed,
        systemSwapPercent: sysSwapPercent,
        
        timestamp: new Date().toISOString(),
      };

      const payloadString = JSON.stringify(payload);

      // Set key with 15 second expiration in case worker dies (current stats)
      await this.redis.set(
        'worker:system:stats',
        payloadString,
        'EX',
        15,
      );

      // Store historical stats in a list (keep last 120 items = 10 minutes)
      const historyKey = 'worker:system:stats:history';
      const pipeline = this.redis.pipeline();
      pipeline.lpush(historyKey, payloadString);
      pipeline.ltrim(historyKey, 0, 119); // 0 to 119 = 120 items
      // Expire history if worker stops (e.g. after 10 mins)
      pipeline.expire(historyKey, 600);
      await pipeline.exec();
    } catch (err) {
      this.logger.error('Failed to report system stats', err);
    }
  }
}
