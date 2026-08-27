import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { TypesenseSchemaService } from './typesense-schema.service';
import { CoreApiClientService } from './core-api-client.service';
import { SearchController } from './search.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    HttpModule,
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
      name: 'default',
    }),
    BullModule.registerQueue({
      name: 'crawl-queue',
    }),
  ],
  controllers: [AppController, SearchController],
  providers: [
    TypesenseSchemaService,
    CoreApiClientService,
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
