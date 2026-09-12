import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CreateDomainDto } from './dto/create-domain.dto';

@Injectable()
export class DomainsService {
  private readonly logger = new Logger(DomainsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(
    userId: string,
    createDomainDto: CreateDomainDto,
    authorization?: string,
  ) {
    const { projectId, name } = createDomainDto;

    const member = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    if (!member || member.role === 'VIEWER') {
      throw new UnauthorizedException(
        'You do not have permission to add domains to this project',
      );
    }

    const existingDomain = await this.prisma.domain.findUnique({
      where: { name },
    });

    if (existingDomain) {
      throw new BadRequestException('Domain name is already taken');
    }

    const domain = await this.prisma.domain.create({
      data: {
        name,
        projectId,
      },
    });

    // Fire and forget initial crawl trigger
    try {
      const searchApiUrl =
        this.configService.get<string>('SEARCH_API_URL') ||
        'http://localhost:3002';

      this.httpService
        .post(
          `${searchApiUrl}/search/crawl/${projectId}`,
          { url: `https://${name}`, domain: name },
          {
            timeout: 5000,
            headers: authorization ? { authorization } : {},
          },
        )
        .subscribe({
          next: () =>
            this.logger.log(
              `Successfully triggered initial crawl for new domain ${name}`,
            ),
          error: (err) =>
            this.logger.error(
              `Failed to trigger initial crawl for domain ${name}`,
              err instanceof Error ? err.stack : 'Unknown Error',
            ),
        });
    } catch (error) {
      this.logger.error(
        'Failed to initiate HTTP request for crawl trigger',
        error,
      );
    }

    return domain;
  }

  async findAll(userId: string, projectId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    if (!member) {
      throw new UnauthorizedException('You do not have access to this project');
    }

    return this.prisma.domain.findMany({
      where: { projectId },
    });
  }

  async remove(userId: string, id: string, authorization?: string) {
    const domain = await this.prisma.domain.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!domain) {
      throw new NotFoundException(`Domain with ID ${id} not found`);
    }

    const member = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId: domain.projectId } },
    });

    if (!member || member.role === 'VIEWER') {
      throw new UnauthorizedException(
        'You do not have permission to delete domains from this project',
      );
    }

    // 1. Notify Search Service to delete domain data (Typesense, BullMQ, Redis)
    try {
      const searchApiUrl =
        this.configService.get<string>('SEARCH_API_URL') ||
        'http://localhost:3002';
      await firstValueFrom(
        this.httpService.delete(
          `${searchApiUrl}/search/projects/${domain.projectId}/domains/${domain.name}`,
          {
            timeout: 5000,
            headers: authorization ? { authorization } : {},
          },
        ),
      );
      this.logger.log(
        `Successfully notified Search API to delete data for domain ${domain.name}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify Search API to delete data for domain ${domain.name}`,
        error instanceof Error ? error.stack : 'Unknown Error',
      );
      // We log the error but still proceed to delete from DB to prevent a stuck state
    }

    // 2. Delete Domain from DB (which automatically cascades to Products due to onDelete: Cascade)
    return this.prisma.domain.delete({
      where: { id },
    });
  }
}
