/*
  Warnings:

  - You are about to drop the column `projectId` on the `Domain` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Domain" DROP CONSTRAINT "Domain_projectId_fkey";

-- AlterTable
ALTER TABLE "Domain" DROP COLUMN "projectId";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "projectId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ProjectDomain" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectDomain_projectId_domainId_key" ON "ProjectDomain"("projectId", "domainId");

-- AddForeignKey
ALTER TABLE "ProjectDomain" ADD CONSTRAINT "ProjectDomain_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDomain" ADD CONSTRAINT "ProjectDomain_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
