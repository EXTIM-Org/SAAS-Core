import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Headers,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { CoreApiClientService } from './core-api-client.service';
import { PrismaService } from './prisma.service';
import { Client } from 'typesense';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

@Controller('search')
export class SearchController {
  constructor(
    private readonly coreApiClientService: CoreApiClientService,
    private readonly prisma: PrismaService,
    @Inject('TYPESENSE_CLIENT') private readonly typesenseClient: Client,
    @InjectQueue('crawl-queue') private readonly crawlQueue: Queue,
  ) {}

  @Get('public/:projectId/search')
  async publicSearch(
    @Param('projectId') projectId: string,
    @Query('q') q: string,
  ) {
    if (!q || !q.trim()) {
      return [];
    }

    try {
      const searchResults = await this.typesenseClient
        .collections('documents')
        .documents()
        .search({
          q,
          query_by: 'title,content',
          filter_by: `projectId:=${projectId}`,
          per_page: 5, // Keep widget results concise
        });

      return searchResults.hits?.map((hit) => hit.document) || [];
    } catch (error) {
      console.error('Public search error:', error);
      return [];
    }
  }

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

    // Update lastCrawledAt in the database if domain matches
    try {
      const domainRecord = await this.prisma.domain.findUnique({
        where: { name: body.domain },
      });
      if (domainRecord) {
        await this.prisma.domain.update({
          where: { id: domainRecord.id },
          data: { lastCrawledAt: new Date() },
        });
      }
    } catch (err) {
      console.error('Error updating lastCrawledAt:', err);
    }

    return { success: true, message: 'URL added to crawl queue' };
  }

  @Get(':projectId/documents')
  async getDocuments(
    @Param('projectId') projectId: string,
    @Query('page') page: string = '1',
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

    try {
      const pageNumber = parseInt(page, 10) || 1;
      const perPage = 10;
      const searchResults = await this.typesenseClient
        .collections('documents')
        .documents()
        .search({
          q: '*',
          filter_by: `projectId:=${projectId}`,
          per_page: perPage,
          page: pageNumber,
        });

      return {
        documents: searchResults.hits?.map((hit) => hit.document) || [],
        total: searchResults.found,
        page: searchResults.page,
        totalPages: Math.ceil(searchResults.found / perPage),
      };
    } catch (error) {
      console.error('Error fetching documents from Typesense:', error);
      return { documents: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  @Delete(':projectId/documents')
  async deleteAllDocuments(
    @Param('projectId') projectId: string,
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

    try {
      await this.typesenseClient
        .collections('documents')
        .documents()
        .delete({ filter_by: `projectId:=${projectId}` });

      return { success: true, message: 'All documents deleted successfully' };
    } catch (error) {
      console.error('Error deleting all documents:', error);
      throw new NotFoundException('Failed to delete documents');
    }
  }

  @Delete(':projectId/documents/:documentId')
  async deleteDocument(
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
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

    try {
      const doc: any = await this.typesenseClient
        .collections('documents')
        .documents(documentId)
        .retrieve();

      if (doc.projectId !== projectId) {
        throw new NotFoundException('Document not found for this project');
      }

      await this.typesenseClient
        .collections('documents')
        .documents(documentId)
        .delete();

      return { success: true, message: 'Document deleted successfully' };
    } catch (error) {
      throw new NotFoundException('Document not found');
    }
  }

  @Delete(':projectId/queue')
  async clearQueue(
    @Param('projectId') projectId: string,
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

    try {
      // Get all jobs and remove the ones for this project
      const jobs = await this.crawlQueue.getJobs([
        'waiting',
        'active',
        'delayed',
        'failed',
        'prioritized'
      ]);
      
      const projectJobs = jobs.filter(j => j.data?.projectId === projectId);
      let deletedCount = 0;
      
      const chunkSize = 500;
      for (let i = 0; i < projectJobs.length; i += chunkSize) {
        const chunk = projectJobs.slice(i, i + chunkSize);
        await Promise.all(chunk.map(job => job.remove().catch(() => {})));
        deletedCount += chunk.length;
      }

      // Clear the Redis cache for this project's crawled URLs and visited links
      try {
        const redis = new Redis({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        });
        
        // Find all crawled keys for this project
        const keys = await redis.keys(`crawled:${projectId}:*`);
        
        // Add the visited set key
        keys.push(`visited:${projectId}`);
        
        if (keys.length > 0) {
          await redis.del(...keys);
        }
        redis.disconnect();
      } catch (err) {
        console.error('Error clearing Redis cache:', err);
      }

      return { success: true, message: `Cleared ${deletedCount} jobs from the queue and reset crawler cache.` };
    } catch (error) {
      console.error('Error clearing queue:', error);
      throw new NotFoundException('Failed to clear queue');
    }
  }
}
