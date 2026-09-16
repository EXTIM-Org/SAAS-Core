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

async function run() {
  console.log('Clearing crawled cache...');
  const keys = await connection.keys('crawled:*');
  if (keys.length > 0) {
    await connection.del(...keys);
    console.log(`Cleared ${keys.length} cache keys.`);
  }

  // Adding the job
  console.log('Adding dragonflywood.ir to the queue...');
  await myQueue.add('crawl-job', {
    projectId: 'test_project',
    domain: 'dragonflywood.ir',
    url: 'https://dragonflywood.ir',
    depth: 0,
  });
  console.log('Job added!');
  process.exit(0);
}

run().catch(console.error);
