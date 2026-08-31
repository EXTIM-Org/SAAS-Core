/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Job, Queue } from 'bullmq';
import { Client } from 'typesense';
import * as cheerio from 'cheerio';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Redis from 'ioredis';
import * as https from 'https';
import * as dns from 'dns/promises';
// @ts-ignore
import * as randomUseragent from 'random-useragent';

export interface JobData {
  projectId: string;
  domain?: string;
  url?: string;
  depth?: number;
  productId?: string;
  name?: string;
  description?: string;
  price?: number;
}

@Processor('crawl-queue', {
  concurrency: 5,
})
export class CrawlProcessor extends WorkerHost {
  private readonly logger = new Logger(CrawlProcessor.name);
  private readonly redisClient: Redis;
  private readonly httpsAgent: https.Agent;

  constructor(
    @Inject('TYPESENSE_CLIENT') private readonly typesenseClient: Client,
    private readonly httpService: HttpService,
    @InjectQueue('crawl-queue') private readonly crawlQueue: Queue,
  ) {
    super();
    const redisUrl =
      process.env.REDIS_URL ||
      process.env.REDIS_URL_DOCKER ||
      'redis://127.0.0.1:6379';
    this.redisClient = new Redis(redisUrl);
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
    });
  }

  private isPrivateIP(ip: string): boolean {
    return /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1|fd[0-9a-f]{2}:|169\.254\.)/.test(
      ip,
    );
  }

  async process(job: Job<JobData, void, string>): Promise<void> {
    if (job.name === 'index-product') {
      await this.processProduct(job);
      return;
    }

    this.logger.log(`Processing job ${job.id} for URL: ${job.data.url}`);

    const { projectId, domain, url, depth = 0 } = job.data;
    const MAX_DEPTH = 3;

    if (!url || !domain) {
      this.logger.error(`Missing url or domain for crawl job ${job.id}`);
      throw new Error('Missing url or domain');
    }

    // Check if crawl for this project was cancelled
    const isCancelled = await this.redisClient.get(`cancel_crawl:${projectId}`);
    if (isCancelled) {
      this.logger.warn(
        `Job ${job.id} aborted because crawl for project ${projectId} was cancelled.`,
      );
      return;
    }

    const visitedKey = `visited:${projectId}`;

    // Mark current URL as visited to prevent duplicate crawling
    await this.redisClient.sadd(visitedKey, url);

    if (depth === 0 && !url.endsWith('.xml')) {
      await this.tryDiscoverSitemap(url, domain, projectId, this.redisClient);
    }

    let title: string;
    let content: string;
    let isProduct = false;
    let productData: any = {};

    const userAgent =
      randomUseragent.getRandom((ua: any) => {
        return (
          ua.browserName === 'Chrome' && parseFloat(ua.browserMajor) >= 100
        );
      }) ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

    const requestHeaders = {
      'User-Agent': userAgent,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua':
        '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    };

    try {
      const urlObj = new URL(url);
      const lookup = await dns.lookup(urlObj.hostname);
      if (this.isPrivateIP(lookup.address)) {
        throw new Error(
          `SSRF Blocked: URL resolves to private IP (${lookup.address})`,
        );
      }

      const isXml = url.endsWith('.xml');
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: isXml ? 30000 : 10000,
          headers: requestHeaders,
          httpsAgent: this.httpsAgent,
          maxRedirects: 5,
          maxContentLength: 5 * 1024 * 1024, // 5MB limit
          maxBodyLength: 5 * 1024 * 1024, // 5MB limit
        }),
      );
      const html = response.data;

      const contentType = response.headers['content-type'] || '';
      if (
        url.endsWith('.xml') ||
        (typeof contentType === 'string' && contentType.includes('xml'))
      ) {
        const $ = cheerio.load(html, { xmlMode: true });
        const links = new Set<string>();

        $('loc').each((_, el) => {
          const locUrl = $(el).text().trim();
          if (!locUrl) return;
          try {
            const absoluteUrl = new URL(locUrl, url);
            if (
              absoluteUrl.protocol !== 'http:' &&
              absoluteUrl.protocol !== 'https:'
            )
              return;
            const linkHostname = absoluteUrl.hostname;
            if (
              linkHostname === domain ||
              linkHostname.endsWith(`.${domain}`)
            ) {
              links.add(absoluteUrl.toString());
            }
          } catch (e) {
            // Ignore invalid URLs
          }
        });

        // Check cancellation before pushing XML links
        const cancelCheckXml = await this.redisClient.get(
          `cancel_crawl:${projectId}`,
        );
        if (cancelCheckXml) {
          this.logger.warn(
            `Aborting sitemap enqueue for project ${projectId} due to cancellation.`,
          );
          return;
        }

        let enqueuedCount = 0;
        for (const link of links) {
          const added = await this.redisClient.sadd(visitedKey, link);
          if (added === 1) {
            const isSitemap = link.endsWith('.xml');
            await this.crawlQueue.add('crawl-job', {
              projectId,
              domain,
              url: link,
              depth: isSitemap ? 0 : 1, // Sitemaps get depth 0 to parse fully, normal links start at depth 1
            });
            enqueuedCount++;
          }
        }

        this.logger.log(
          `Successfully processed sitemap: ${url}. Enqueued ${enqueuedCount} new URLs.`,
        );
        return; // Skip standard HTML indexing
      }

      const $ = cheerio.load(html);

      title = $('title').text().trim() || url;

      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html() || '{}');
          const items = Array.isArray(json) ? json : [json];

          for (const item of items) {
            const entities = item['@graph'] ? item['@graph'] : [item];
            for (const entity of entities) {
              if (
                entity['@type'] === 'Product' ||
                (Array.isArray(entity['@type']) &&
                  entity['@type'].includes('Product'))
              ) {
                isProduct = true;
                productData.name = entity.name || productData.name;
                productData.description =
                  entity.description || productData.description;

                if (entity.image) {
                  const firstImage = Array.isArray(entity.image)
                    ? entity.image[0]
                    : entity.image;

                  productData.image_url =
                    typeof firstImage === 'string'
                      ? firstImage
                      : firstImage?.url;
                }

                if (entity.brand) {
                  productData.brand =
                    typeof entity.brand === 'string'
                      ? entity.brand
                      : entity.brand.name;
                }

                if (entity.offers) {
                  const offer = Array.isArray(entity.offers)
                    ? entity.offers[0]
                    : entity.offers;
                  productData.price =
                    parseFloat(offer.price) || productData.price;
                  productData.currency =
                    offer.priceCurrency || productData.currency;
                  productData.in_stock = offer.availability
                    ? offer.availability.includes('InStock')
                    : true;
                }
              }
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      });

      // 1. Recursive link extraction (BEFORE removing DOM elements)
      if (depth < MAX_DEPTH) {
        const links = new Set<string>();
        $('a[href]').each((_, el) => {
          let href = $(el).attr('href');
          if (!href) return;

          href = href.split('#')[0]; // Strip hash fragment

          try {
            const absoluteUrl = new URL(href, url);
            if (
              absoluteUrl.protocol !== 'http:' &&
              absoluteUrl.protocol !== 'https:'
            )
              return;

            const linkHostname = absoluteUrl.hostname;
            if (
              linkHostname === domain ||
              linkHostname.endsWith(`.${domain}`)
            ) {
              links.add(absoluteUrl.toString());
            }
          } catch (e) {
            // Ignore invalid URLs
          }
        });

        // Check cancellation before pushing HTML links
        const cancelCheckHtml = await this.redisClient.get(
          `cancel_crawl:${projectId}`,
        );
        if (cancelCheckHtml) {
          this.logger.warn(
            `Aborting link enqueue for project ${projectId} due to cancellation.`,
          );
          return;
        }

        // Enqueue new unvisited links
        for (const link of links) {
          const added = await this.redisClient.sadd(visitedKey, link);
          if (added === 1) {
            // 1 means it was newly added (unvisited)
            await this.crawlQueue.add('crawl-job', {
              projectId,
              domain,
              url: link,
              depth: depth + 1,
            });
          }
        }
      }

      // 2. Remove unwanted elements for clean content extraction
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

    const documentId = Buffer.from(url).toString('hex');

    const document = {
      id: documentId,
      projectId,
      domain,
      url,
      title,
      content,
      crawledAt: Date.now(),
    };

    try {
      await this.typesenseClient
        .collections('documents')
        .documents()
        .upsert(document);

      this.logger.log(`Successfully indexed document for URL: ${url}`);

      if (isProduct && productData.name) {
        const productDocument = {
          id: documentId,
          projectId,
          title: productData.name,
          description: productData.description || content.substring(0, 200),
          url,
          image_url: productData.image_url,
          price: productData.price,
          currency: productData.currency,
          in_stock: productData.in_stock,
          brand: productData.brand,
        };

        await this.typesenseClient
          .collections('products')
          .documents()
          .upsert(productDocument);
        this.logger.log(`Successfully indexed product for URL: ${url}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to index document/product for URL: ${url}`,
        error instanceof Error ? error.stack : 'Unknown Error',
      );
      throw error; // Let BullMQ handle retry based on the backoff config
    }
  }

  private async processProduct(job: Job<JobData, void, string>): Promise<void> {
    this.logger.log(
      `Processing index-product job ${job.id} for Product: ${job.data.productId}`,
    );

    const { projectId, productId, name, description, price } = job.data;

    if (!projectId || !productId || !name) {
      this.logger.error(
        `Missing required fields for index-product job ${job.id}`,
      );
      throw new Error('Missing required fields for product');
    }

    const document = {
      id: productId,
      projectId,
      name,
      description,
      price,
    };

    try {
      await this.typesenseClient
        .collections('products')
        .documents()
        .upsert(document);

      this.logger.log(`Successfully indexed product: ${productId}`);
    } catch (error) {
      this.logger.error(
        `Failed to index product: ${productId}`,
        error instanceof Error ? error.stack : 'Unknown Error',
      );
      throw error;
    }
  }

  private async tryDiscoverSitemap(
    baseUrl: string,
    domain: string,
    projectId: string,
    redis: any,
  ) {
    const sitemapDiscoveredKey = `sitemap_discovered:${projectId}`;

    // Only try discovering once per project crawl to avoid spamming
    const alreadyTried = await redis.setnx(sitemapDiscoveredKey, '1');
    if (alreadyTried === 0) return; // 0 means key existed
    await redis.expire(sitemapDiscoveredKey, 3600); // expire in 1 hr

    try {
      const rootUrl = new URL(baseUrl);

      const lookup = await dns.lookup(rootUrl.hostname);
      if (this.isPrivateIP(lookup.address)) return;

      rootUrl.pathname = '/robots.txt';
      rootUrl.search = '';

      const robotsUrl = rootUrl.toString();
      const response = await firstValueFrom(
        this.httpService
          .get(robotsUrl, {
            timeout: 5000,
            httpsAgent: this.httpsAgent,
            maxContentLength: 1 * 1024 * 1024, // 1MB limit for robots.txt
            maxBodyLength: 1 * 1024 * 1024,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            },
          })
          .pipe(catchError(() => of(null))),
      );

      let sitemapUrl = '';
      if (response && response.data && typeof response.data === 'string') {
        const match = response.data.match(/Sitemap:\s*(https?:\/\/[^\s]+)/i);
        if (match) {
          sitemapUrl = match[1];
        }
      }

      if (!sitemapUrl) {
        // Fallback to default sitemap.xml
        rootUrl.pathname = '/sitemap.xml';
        sitemapUrl = rootUrl.toString();
      }

      // Enqueue the sitemap without doing a HEAD request (which gets blocked by many firewalls)
      await this.crawlQueue.add('crawl-job', {
        projectId,
        domain,
        url: sitemapUrl,
        depth: 0,
      });
      this.logger.log(`Auto-enqueued sitemap for discovery: ${sitemapUrl}`);
    } catch (e) {
      // Ignore discovery errors
    }
  }
}
