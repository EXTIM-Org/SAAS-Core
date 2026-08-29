-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "autoCrawlIntervalDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "lastCrawledAt" TIMESTAMP(3);
