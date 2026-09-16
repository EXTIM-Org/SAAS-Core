import { Queue } from 'bullmq';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is missing in .env');
}

const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
const myQueue = new Queue('crawl-queue', { connection });

async function check() {
  console.log('Checking Queue Status...');
  const counts = await myQueue.getJobCounts();
  console.log('Job Counts:', counts);

  if (counts.failed > 0) {
    const failed = await myQueue.getFailed(0, 10);
    console.log('Latest Failed Jobs:');
    failed.forEach((job) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log(`- Job ${job.id} (${job.data.url}): ${job.failedReason}`);
    });
  }

  process.exit(0);
}

check().catch(console.error);
