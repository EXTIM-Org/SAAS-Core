import { Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({ host: '127.0.0.1', port: 6379 });
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
