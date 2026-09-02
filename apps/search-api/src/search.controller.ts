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
  private readonly redisClient: Redis;

  constructor(
    private readonly coreApiClientService: CoreApiClientService,
    private readonly prisma: PrismaService,
    @Inject('TYPESENSE_CLIENT') private readonly typesenseClient: Client,
    @InjectQueue('crawl-queue') private readonly crawlQueue: Queue,
  ) {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    this.redisClient = new Redis(redisUrl, { maxRetriesPerRequest: null });
  }

  @Get('admin/stats')
  async getAdminStats(@Headers('authorization') authorization?: string) {
    const isSuperAdmin =
      await this.coreApiClientService.validateSuperAdmin(authorization);
    if (!isSuperAdmin) {
      throw new NotFoundException('Unauthorized');
    }

    try {
      // Get BullMQ queue stats and latest failed jobs
      const queueCounts = await this.crawlQueue.getJobCounts();
      const rawFailedJobs = await this.crawlQueue.getFailed(0, 10);
      const failedJobs = rawFailedJobs.map((job) => ({
        id: job.id,
        projectId: job.data?.projectId,
        domain: job.data?.domain,
        url: job.data?.url,
        failedReason: job.failedReason,
        timestamp: job.timestamp,
      }));

      // Get Typesense collection stats
      let totalDocuments = 0;
      let typesenseHealthy = false;
      try {
        const health = await this.typesenseClient.health.retrieve();
        typesenseHealthy = health.ok;
        const collection = await this.typesenseClient
          .collections('documents')
          .retrieve();
        totalDocuments = collection.num_documents || 0;
      } catch (err) {
        console.error('Failed to retrieve typesense stats::', err instanceof Error ? err.message : err);
      }

      // Get Worker System Stats and Analytics from Redis
      let workerResources = { cpu: 0, memory: 0 };
      let totalSearchesToday = 0;
      let searchLatencyMs = 0;

      try {
        const rawWorkerStats = await this.redisClient.get(
          'worker:system:stats',
        );
        if (rawWorkerStats) {
          workerResources = JSON.parse(rawWorkerStats);
        }

        const searches = await this.redisClient.get('search_count:today');
        if (searches) {
          totalSearchesToday = parseInt(searches, 10);
        }
      } catch (err) {
        console.error('Failed to retrieve stats from Redis::', err instanceof Error ? err.message : err);
      }

      // Fetch Typesense Latency (from /stats.json) and Top Tenants
      let topTenants: any[] = [];
      try {
        const node = this.typesenseClient.configuration.nodes[0] as any;
        const typesenseUrl =
          node.url || `${node.protocol}://${node.host}:${node.port}`;
        const apiKey = this.typesenseClient.configuration.apiKey;
        const res = await fetch(`${typesenseUrl}/stats.json`, {
          headers: { 'X-TYPESENSE-API-KEY': apiKey },
        });
        const statsData = await res.json();
        if (statsData && typeof statsData.search_latency_ms === 'number') {
          searchLatencyMs = statsData.search_latency_ms;
        }

        // Top Tenants (Indexed Docs)
        const facetResults = await this.typesenseClient
          .collections('documents')
          .documents()
          .search({
            q: '*',
            facet_by: 'projectId',
            max_facet_values: 5,
            per_page: 0,
          });

        const projectCounts =
          facetResults.facet_counts?.find((f) => f.field_name === 'projectId')
            ?.counts || [];

        if (projectCounts.length > 0) {
          const projectIds = projectCounts.map((c) => c.value);
          const projects = await this.prisma.project.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, name: true },
          });

          topTenants = projectCounts.map((c) => {
            const proj = projects.find((p) => p.id === c.value);
            return {
              projectId: c.value,
              name: proj ? proj.name : 'Unknown Project',
              count: c.count,
            };
          });
        }
      } catch (err) {
        console.error('Failed to fetch typesense analytics or facets::', err instanceof Error ? err.message : err);
      }

      return {
        success: true,
        queue: {
          waiting: queueCounts.waiting || 0,
          active: queueCounts.active || 0,
          failed: queueCounts.failed || 0,
          completed: queueCounts.completed || 0,
          delayed: queueCounts.delayed || 0,
        },
        typesense: {
          healthy: typesenseHealthy,
          totalDocuments,
        },
        workerResources,
        analytics: {
          latency: searchLatencyMs,
          totalSearches: totalSearchesToday,
        },
        topTenants,
        failedJobs,
      };
    } catch (error) {
      console.error('Error fetching search admin stats::', error instanceof Error ? error.message : error);
      throw new NotFoundException('Failed to fetch search stats');
    }
  }

  @Get(':projectId/analytics')
  async getTenantAnalytics(
    @Param('projectId') projectId: string,
    @Headers('authorization') authorization?: string,
  ) {
    if (authorization) {
      const isValid = await this.coreApiClientService.validateProject(
        projectId,
        authorization,
      );
      if (!isValid) {
        throw new NotFoundException(
          `Project with ID ${projectId} not found or unauthorized`,
        );
      }
    }

    try {
      const totalSearchesStr = await this.redisClient.get(
        `tenant:${projectId}:searches`,
      );
      const totalSearches = totalSearchesStr
        ? parseInt(totalSearchesStr, 10)
        : 0;

      const topQueriesRaw = await this.redisClient.zrevrange(
        `tenant:${projectId}:top_queries`,
        0,
        9,
        'WITHSCORES',
      );
      const topQueries = [];
      for (let i = 0; i < topQueriesRaw.length; i += 2) {
        topQueries.push({
          term: topQueriesRaw[i],
          count: parseInt(topQueriesRaw[i + 1], 10),
        });
      }

      const zeroQueriesRaw = await this.redisClient.zrevrange(
        `tenant:${projectId}:zero_queries`,
        0,
        9,
        'WITHSCORES',
      );
      const zeroQueries = [];
      for (let i = 0; i < zeroQueriesRaw.length; i += 2) {
        zeroQueries.push({
          term: zeroQueriesRaw[i],
          count: parseInt(zeroQueriesRaw[i + 1], 10),
        });
      }

      return {
        totalSearches,
        topQueries,
        zeroQueries,
      };
    } catch (error) {
      console.error('Error fetching analytics::', error instanceof Error ? error.message : error);
      return { totalSearches: 0, topQueries: [], zeroQueries: [] };
    }
  }

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

      // Track search
      try {
        await this.redisClient.incr('search_count:today');

        // Tenant tracking
        await this.redisClient.incr(`tenant:${projectId}:searches`);
        await this.redisClient.zincrby(
          `tenant:${projectId}:top_queries`,
          1,
          q.toLowerCase(),
        );

        const hasHits = searchResults.hits && searchResults.hits.length > 0;
        if (!hasHits) {
          await this.redisClient.zincrby(
            `tenant:${projectId}:zero_queries`,
            1,
            q.toLowerCase(),
          );
        }

        // Set expiry to midnight UTC if it's newly created
        const ttl = await this.redisClient.ttl('search_count:today');
        if (ttl === -1) {
          const now = new Date();
          const nextMidnight = new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate() + 1,
            ),
          );
          await this.redisClient.expireat(
            'search_count:today',
            Math.floor(nextMidnight.getTime() / 1000),
          );
        }
      } catch (e) {}

      return searchResults.hits?.map((hit) => hit.document) || [];
    } catch (error) {
      console.error('Public search error::', error instanceof Error ? error.message : error);
      return [];
    }
  }

  @Get('public/:projectId/products/search')
  async publicProductSearch(
    @Param('projectId') projectId: string,
    @Query('q') q: string,
    @Query('min_price') minPrice?: string,
    @Query('max_price') maxPrice?: string,
    @Query('brand') brand?: string,
    @Query('in_stock') inStock?: string,
  ) {
    if (!q || q.trim() === '') return { results: [], facets: [] };

    try {
      let filterBy = `projectId:=${projectId}`;

      if (minPrice) filterBy += ` && price:>=${minPrice}`;
      if (maxPrice) filterBy += ` && price:<=${maxPrice}`;
      if (brand) filterBy += ` && brand:=${brand}`;
      if (inStock === 'true') filterBy += ` && in_stock:=true`;

      const searchResults = await this.typesenseClient
        .collections('products')
        .documents()
        .search({
          q,
          query_by: 'title,description,brand',
          filter_by: filterBy,
          facet_by: 'brand,price,in_stock',
          per_page: 10,
        });

      // Track search
      try {
        await this.redisClient.incr('search_count:today');
        await this.redisClient.incr(`tenant:${projectId}:searches`);
        await this.redisClient.zincrby(
          `tenant:${projectId}:top_queries`,
          1,
          q.toLowerCase(),
        );

        const hasHits = searchResults.hits && searchResults.hits.length > 0;
        if (!hasHits) {
          await this.redisClient.zincrby(
            `tenant:${projectId}:zero_queries`,
            1,
            q.toLowerCase(),
          );
        }

        const ttl = await this.redisClient.ttl('search_count:today');
        if (ttl === -1) {
          const now = new Date();
          const nextMidnight = new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate() + 1,
            ),
          );
          await this.redisClient.expireat(
            'search_count:today',
            Math.floor(nextMidnight.getTime() / 1000),
          );
        }
      } catch (e) {}

      return {
        results: searchResults.hits?.map((hit) => hit.document) || [],
        facets: searchResults.facet_counts || [],
      };
    } catch (error) {
      console.error('Public product search error::', error instanceof Error ? error.message : error);
      return { results: [], facets: [] };
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

    // Track search
    try {
      await this.redisClient.incr('search_count:today');

      // Tenant tracking
      await this.redisClient.incr(`tenant:${projectId}:searches`);
      await this.redisClient.zincrby(
        `tenant:${projectId}:top_queries`,
        1,
        q.toLowerCase(),
      );

      const hasHits = searchResults.hits && searchResults.hits.length > 0;
      if (!hasHits) {
        await this.redisClient.zincrby(
          `tenant:${projectId}:zero_queries`,
          1,
          q.toLowerCase(),
        );
      }

      const ttl = await this.redisClient.ttl('search_count:today');
      if (ttl === -1) {
        const now = new Date();
        const nextMidnight = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1,
          ),
        );
        await this.redisClient.expireat(
          'search_count:today',
          Math.floor(nextMidnight.getTime() / 1000),
        );
      }
    } catch (e) {}

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
      console.error('Error updating lastCrawledAt::', err instanceof Error ? err.message : err);
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
      console.error('Error fetching documents from Typesense::', error instanceof Error ? error.message : error);
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
      console.error('Error deleting all documents::', error instanceof Error ? error.message : error);
      throw new NotFoundException('Failed to delete documents');
    }
  }

  @Get(':projectId/products')
  async getProducts(
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
        .collections('products')
        .documents()
        .search({
          q: '*',
          filter_by: `projectId:=${projectId}`,
          per_page: perPage,
          page: pageNumber,
        });

      return {
        products: searchResults.hits?.map((hit) => hit.document) || [],
        total: searchResults.found,
        page: searchResults.page,
        totalPages: Math.ceil(searchResults.found / perPage),
      };
    } catch (error) {
      console.error('Error fetching products from Typesense::', error instanceof Error ? error.message : error);
      return { products: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  @Delete(':projectId/products')
  async deleteAllProducts(
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
        .collections('products')
        .documents()
        .delete({ filter_by: `projectId:=${projectId}` });

      return { success: true, message: 'All products deleted successfully' };
    } catch (error) {
      console.error('Error deleting all products::', error instanceof Error ? error.message : error);
      throw new NotFoundException('Failed to delete products');
    }
  }

  @Delete(':projectId/products/:productId')
  async deleteProduct(
    @Param('projectId') projectId: string,
    @Param('productId') productId: string,
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
        .collections('products')
        .documents(productId)
        .retrieve();

      if (doc.projectId !== projectId) {
        throw new NotFoundException('Product not found for this project');
      }

      await this.typesenseClient
        .collections('products')
        .documents(productId)
        .delete();

      return { success: true, message: 'Product deleted successfully' };
    } catch (error) {
      throw new NotFoundException('Product not found');
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
        'prioritized',
      ]);

      const projectJobs = jobs.filter((j) => j.data?.projectId === projectId);
      let deletedCount = 0;

      const chunkSize = 500;
      for (let i = 0; i < projectJobs.length; i += chunkSize) {
        const chunk = projectJobs.slice(i, i + chunkSize);
        await Promise.all(chunk.map((job) => job.remove().catch(() => {})));
        deletedCount += chunk.length;
      }

      // Clear the Redis cache for this project's crawled URLs and visited links
      try {
        // Find all crawled keys for this project
        const keys = await this.redisClient.keys(`crawled:${projectId}:*`);

        // Add the visited set key
        keys.push(`visited:${projectId}`);

        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }

        // Signal active workers to stop immediately
        await this.redisClient.set(`cancel_crawl:${projectId}`, '1', 'EX', 60);

      } catch (err) {
        console.error('Error clearing Redis cache::', err instanceof Error ? err.message : err);
      }

      return {
        success: true,
        message: `Cleared ${deletedCount} jobs from the queue and reset crawler cache.`,
      };
    } catch (error) {
      console.error('Error clearing queue::', error instanceof Error ? error.message : error);
      throw new NotFoundException('Failed to clear queue');
    }
  }

  @Post('admin/queue/retry/:jobId')
  async retryFailedJob(
    @Param('jobId') jobId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const isSuperAdmin =
      await this.coreApiClientService.validateSuperAdmin(authorization);
    if (!isSuperAdmin) {
      throw new NotFoundException('Unauthorized');
    }

    try {
      const job = await this.crawlQueue.getJob(jobId);
      if (!job) {
        throw new NotFoundException(`Job with ID ${jobId} not found`);
      }

      await job.retry();

      return { success: true, message: `Job ${jobId} is being retried` };
    } catch (error) {
      console.error(`Error retrying job ${jobId}:`, error);
      throw new NotFoundException('Failed to retry job');
    }
  }
}
