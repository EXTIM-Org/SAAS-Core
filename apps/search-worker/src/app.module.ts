import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { CrawlProcessor } from './crawl.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url:
            configService.get<string>('REDIS_URL_DOCKER') ||
            configService.get<string>('REDIS_URL') ||
            'redis://localhost:6379',
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'crawl-queue',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    CrawlProcessor,
    {
      provide: 'TYPESENSE_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const { Client } = await import('typesense');
        const url =
          configService.get<string>('TYPESENSE_URL_DOCKER') ||
          configService.get<string>('TYPESENSE_URL') ||
          'http://localhost:8108';
        const apiKey =
          configService.get<string>('TYPESENSE_API_KEY') ||
          'typesense-local-key';

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
