const IORedis = require('ioredis');
const { Queue } = require('bullmq');

const connection = new IORedis('redis://127.0.0.1:6379');
const crawlQueue = new Queue('crawl', { connection });

async function check() {
  const waiting = await crawlQueue.getWaitingCount();
  const active = await crawlQueue.getActiveCount();
  const delayed = await crawlQueue.getDelayedCount();
  const failed = await crawlQueue.getFailedCount();
  const completed = await crawlQueue.getCompletedCount();

  console.log({ waiting, active, delayed, failed, completed });

  if (failed > 0) {
    const failedJobs = await crawlQueue.getFailed(0, 5);
    for (const job of failedJobs) {
      console.log('Failed job', job.id, job.failedReason);
    }
  }

  process.exit(0);
}
check();
