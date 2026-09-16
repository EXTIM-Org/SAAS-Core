import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { CrawlProcessor } from './crawl.processor';
import { TypesenseSchemaService } from './typesense-schema.service';
import { SystemMonitorService } from './system-monitor.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (!redisUrl) {
          throw new Error('REDIS_URL environment variable is missing');
        }
        return {
          connection: { url: redisUrl },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'crawl-queue',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    }),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [
    CrawlProcessor,
    TypesenseSchemaService,
    SystemMonitorService,
    {
      provide: 'TYPESENSE_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const { Client } = await import('typesense');
        const url = configService.get<string>('TYPESENSE_URL');
        if (!url) {
          throw new Error('TYPESENSE_URL environment variable is missing');
        }
        const apiKey = configService.get<string>('TYPESENSE_API_KEY');
        if (!apiKey) {
          throw new Error('TYPESENSE_API_KEY environment variable is missing');
        }

        const urlObj = new URL(url);

        return new Client({
          nodes: [
            {
              host: urlObj.hostname,
              port:
                parseInt(urlObj.port) ||
                (urlObj.protocol === 'https:' ? 443 : 80),
              protocol: urlObj.protocol.replace(':', ''),
            },
          ],
          apiKey,
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}
