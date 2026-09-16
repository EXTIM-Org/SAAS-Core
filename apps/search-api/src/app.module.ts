import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { TypesenseSchemaService } from './typesense-schema.service';
import { CoreApiClientService } from './core-api-client.service';
import { SearchController } from './search.controller';
import { PrismaService } from './prisma.service';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { CrawlSchedulerService } from './crawl-scheduler.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    HttpModule,
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
      name: 'default',
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
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'default',
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'crawl-queue',
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [AppController, SearchController],
  providers: [
    PrismaService,
    TypesenseSchemaService,
    CoreApiClientService,
    CrawlSchedulerService,
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
