import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { Client } from 'typesense';

@Injectable()
export class TypesenseSchemaService implements OnModuleInit {
  private readonly logger = new Logger(TypesenseSchemaService.name);

  constructor(
    @Inject('TYPESENSE_CLIENT') private readonly typesenseClient: Client,
  ) {}

  async onModuleInit() {
    const collectionName = 'documents';
    try {
      await this.typesenseClient.collections(collectionName).retrieve();
      this.logger.log(
        `Typesense collection '${collectionName}' already exists.`,
      );
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'httpStatus' in error &&
        error.httpStatus === 404
      ) {
        this.logger.log(
          `Typesense collection '${collectionName}' not found. Creating...`,
        );
        await this.typesenseClient.collections().create({
          name: collectionName,
          fields: [
            { name: 'id', type: 'string' },
            { name: 'projectId', type: 'string', facet: true },
            { name: 'domain', type: 'string' },
            { name: 'url', type: 'string' },
            { name: 'title', type: 'string' },
            { name: 'content', type: 'string' },
          ],
        });
        this.logger.log(
          `Typesense collection '${collectionName}' created successfully.`,
        );
      } else {
        this.logger.error(
          `Error checking/creating Typesense collection '${collectionName}'`,
          error,
        );
      }
    }

    const productsCollection = 'products';
    try {
      await this.typesenseClient.collections(productsCollection).retrieve();
      this.logger.log(
        `Typesense collection '${productsCollection}' already exists.`,
      );
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'httpStatus' in error &&
        error.httpStatus === 404
      ) {
        this.logger.log(
          `Typesense collection '${productsCollection}' not found. Creating...`,
        );
        await this.typesenseClient.collections().create({
          name: productsCollection,
          fields: [
            { name: 'id', type: 'string' },
            { name: 'projectId', type: 'string', facet: true },
            { name: 'title', type: 'string' },
            { name: 'description', type: 'string', optional: true },
            { name: 'url', type: 'string' },
            { name: 'image_url', type: 'string', optional: true },
            { name: 'price', type: 'float', facet: true, optional: true },
            { name: 'currency', type: 'string', facet: true, optional: true },
            { name: 'in_stock', type: 'bool', facet: true, optional: true },
            { name: 'brand', type: 'string', facet: true, optional: true },
          ],
        });
        this.logger.log(
          `Typesense collection '${productsCollection}' created successfully.`,
        );
      } else {
        this.logger.error(
          `Error checking/creating Typesense collection '${productsCollection}'`,
          error,
        );
      }
    }
  }
}
