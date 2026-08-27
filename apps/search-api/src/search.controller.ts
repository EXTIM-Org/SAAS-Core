import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Headers,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { CoreApiClientService } from './core-api-client.service';
import { Client } from 'typesense';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('search')
export class SearchController {
  constructor(
    private readonly coreApiClientService: CoreApiClientService,
    @Inject('TYPESENSE_CLIENT') private readonly typesenseClient: Client,
    @InjectQueue('crawl-queue') private readonly crawlQueue: Queue,
  ) {}

  @Get(':projectId')
  async search(
    @Param('projectId') projectId: string,
    @Query('q') q: string,
    @Headers('authorization') authorization?: string,
  ) {
    const isValid = await this.coreApiClientService.validateProject(
      projectId,
      authorization,
    );

    if (!isValid) {
      throw new NotFoundException(
        `Project with ID ${projectId} not found or unauthorized`,
      );
    }

    if (!q) {
      return [];
    }

    const searchResults = await this.typesenseClient
      .collections('documents')
      .documents()
      .search({
        q,
        query_by: 'title,content',
        filter_by: `projectId:=${projectId}`,
      });

    return searchResults.hits?.map((hit) => hit.document) || [];
  }

  @Post('ingest/product')
  async ingestProduct(
    @Body()
    body: {
      productId: string;
      projectId: string;
      name: string;
      description?: string;
      price?: number;
    },
    @Headers('authorization') authorization?: string,
  ) {
    if (!body.projectId || !body.productId || !body.name) {
      throw new NotFoundException('Missing required fields');
    }

    const isValid = await this.coreApiClientService.validateProject(
      body.projectId,
      authorization,
    );

    if (!isValid) {
      throw new NotFoundException(
        `Project with ID ${body.projectId} not found or unauthorized`,
      );
    }

    await this.crawlQueue.add('index-product', body);

    return { success: true, message: 'Product added to index queue' };
  }

  @Post('crawl/:projectId')
  async crawl(
    @Param('projectId') projectId: string,
    @Body() body: { url: string; domain: string },
    @Headers('authorization') authorization?: string,
  ) {
    const isValid = await this.coreApiClientService.validateProject(
      projectId,
      authorization,
    );

    if (!isValid) {
      throw new NotFoundException(
        `Project with ID ${projectId} not found or unauthorized`,
      );
    }

    if (!body.url || !body.domain) {
      throw new NotFoundException('Missing url or domain');
    }

    await this.crawlQueue.add('crawl-job', {
      projectId,
      url: body.url,
      domain: body.domain,
    });

    return { success: true, message: 'URL added to crawl queue' };
  }
}
