import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Client } from 'typesense';

export interface JobData {
  projectId: string;
  domain: string;
  url: string;
}

@Processor('crawl-queue')
export class CrawlProcessor extends WorkerHost {
  private readonly logger = new Logger(CrawlProcessor.name);

  constructor(
    @Inject('TYPESENSE_CLIENT') private readonly typesenseClient: Client,
  ) {
    super();
  }

  async process(job: Job<JobData, void, string>): Promise<void> {
    this.logger.log(`Processing job ${job.id} for URL: ${job.data.url}`);

    const { projectId, domain, url } = job.data;

    // Mock extraction logic
    const title = `Mocked Title for ${url}`;
    const content = `This is mocked content extracted from the URL: ${url}. The crawler would normally fetch the page and extract text.`;

    const documentId = Buffer.from(url).toString('base64');

    const document = {
      id: documentId,
      projectId,
      domain,
      url,
      title,
      content,
      type: 'page',
      crawledAt: Date.now(),
    };

    try {
      await this.typesenseClient
        .collections('documents')
        .documents()
        .upsert(document);

      this.logger.log(`Successfully indexed document for URL: ${url}`);
    } catch (error) {
      this.logger.error(
        `Failed to index document for URL: ${url}`,
        error instanceof Error ? error.stack : 'Unknown Error',
      );
      throw error; // Let BullMQ handle retry based on the backoff config
    }
  }
}
