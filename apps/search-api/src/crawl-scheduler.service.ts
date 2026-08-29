import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CrawlSchedulerService {
  private readonly logger = new Logger(CrawlSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('crawl-queue') private crawlQueue: Queue,
    private configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log('Checking for domains that need to be re-crawled...');

    try {
      const globalSetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'defaultAutoCrawlIntervalDays' },
      });
      const defaultInterval = globalSetting ? parseInt(globalSetting.value) : 30;

      const domains = await this.prisma.domain.findMany({
        include: {
          project: true,
        },
      });

      const now = new Date();
      const domainsToCrawl = domains.filter((domain) => {
        const interval = domain.project.autoCrawlIntervalDays ?? defaultInterval;
        if (interval === 0) return false;
        
        if (!domain.lastCrawledAt) return false;
        
        const nextCrawlTime = new Date(domain.lastCrawledAt);
        nextCrawlTime.setDate(nextCrawlTime.getDate() + interval);
        return now >= nextCrawlTime;
      });

      if (domainsToCrawl.length === 0) {
        this.logger.log('No domains need re-crawling at this time.');
        return;
      }

      this.logger.log(`Found ${domainsToCrawl.length} domains to re-crawl.`);

      const redis = new Redis({
        host: this.configService.get<string>('REDIS_HOST') || '127.0.0.1',
        port: parseInt(this.configService.get<string>('REDIS_PORT') || '6379', 10),
      });

      for (const domain of domainsToCrawl) {
        const projectId = domain.projectId;
        const url = `https://${domain.name}`;
        
        this.logger.log(`Triggering re-crawl for domain: ${domain.name} (Project: ${projectId})`);

        // 1. Clear Redis caches
        const keys = await redis.keys(`crawled:${projectId}:*`);
        keys.push(`visited:${projectId}`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }

        // 2. Add to crawl queue
        await this.crawlQueue.add(
          'crawl',
          { url, domain: domain.name, projectId },
          { removeOnComplete: true, removeOnFail: 1000 },
        );

        // 3. Update lastCrawledAt
        await this.prisma.domain.update({
          where: { id: domain.id },
          data: { lastCrawledAt: now },
        });
      }

      redis.disconnect();
    } catch (error) {
      this.logger.error('Error in crawl scheduler', error);
    }
  }
}
