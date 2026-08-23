import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { Client } from 'typesense';

@Injectable()
export class TypesenseSchemaService implements OnModuleInit {
  private readonly logger = new Logger(TypesenseSchemaService.name);

  constructor(
    @Inject('TYPESENSE_CLIENT') private readonly typesenseClient: Client,
  ) {}

  async onModuleInit() {
    const collections = [
      {
        name: 'documents',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'projectId', type: 'string', facet: true },
          { name: 'domain', type: 'string' },
          { name: 'url', type: 'string' },
          { name: 'title', type: 'string' },
          { name: 'content', type: 'string' },
        ],
      },
      {
        name: 'products',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'projectId', type: 'string', facet: true },
          { name: 'name', type: 'string' },
          { name: 'description', type: 'string', optional: true },
          { name: 'price', type: 'float', optional: true },
        ],
      },
    ];

    for (const collection of collections) {
      try {
        await this.typesenseClient.collections(collection.name).retrieve();
        this.logger.log(`Typesense collection '${collection.name}' already exists.`);
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'httpStatus' in error &&
          (error as Record<string, unknown>).httpStatus === 404
        ) {
          this.logger.log(`Typesense collection '${collection.name}' not found. Creating...`);
          await this.typesenseClient.collections().create({
            name: collection.name,
            fields: collection.fields as Record<string, unknown>[],
          });
          this.logger.log(`Typesense collection '${collection.name}' created successfully.`);
        } else {
          this.logger.error(`Error checking/creating Typesense collection '${collection.name}'`, error);
        }
      }
    }
  }
}
