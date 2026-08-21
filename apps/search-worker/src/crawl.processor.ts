import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Job } from 'bullmq';
import { Client } from 'typesense';
import * as cheerio from 'cheerio';
import { firstValueFrom } from 'rxjs';

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
    private readonly httpService: HttpService,
  ) {
    super();
  }

  async process(job: Job<JobData, void, string>): Promise<void> {
    this.logger.log(`Processing job ${job.id} for URL: ${job.data.url}`);

    const { projectId, domain, url } = job.data;

    let title: string;
    let content: string;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { timeout: 10000 })
      );
      const html = response.data;
      const $ = cheerio.load(html);

      title = $('title').text().trim() || url;

      // Remove unwanted elements
      $('script, style, nav, footer, header, noscript, iframe').remove();

      const body = $('body').length ? $('body') : $('main');
      const text = body.text();

      content = text.replace(/\s+/g, ' ').trim();

      if (!content) {
         this.logger.warn(`No content extracted for URL: ${url}`);
      }
    } catch (error) {
       this.logger.error(
        `Failed to fetch or parse URL: ${url}`,
        error instanceof Error ? error.stack : 'Unknown Error',
      );
      throw error;
    }

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
