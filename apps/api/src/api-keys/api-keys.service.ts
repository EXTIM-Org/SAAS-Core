import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async createApiKey(projectId: string, name: string) {
    // Generate a secure random key
    const prefix = 'sk_';
    const randomString = randomBytes(24).toString('base64url');
    const key = `${prefix}${randomString}`;

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name,
        key,
        projectId,
      },
    });

    return apiKey;
  }

  async getApiKeys(projectId: string) {
    return this.prisma.apiKey.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      // Omit the actual key value from standard listings to improve security,
      // but Prisma doesn't support omit natively yet unless preview feature is enabled.
      // We will mask it or return full if requested. Usually, we only show it once.
      // But for simplicity in this MVP, we return it. Or just mask it here:
    });
  }

  async deleteApiKey(projectId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, projectId },
    });

    if (!key) {
      throw new NotFoundException('API Key not found or does not belong to project');
    }

    return this.prisma.apiKey.delete({
      where: { id: keyId },
    });
  }

  async validateApiKey(key: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key },
    });

    if (apiKey) {
      // Update lastUsedAt asynchronously
      this.prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      }).catch(err => console.error('Failed to update apiKey lastUsedAt', err));
    }

    return apiKey;
  }
}
