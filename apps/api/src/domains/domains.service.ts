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

    let domain = await this.prisma.domain.findUnique({
      where: { name },
    });

    let isNewDomain = false;
    if (!domain) {
      domain = await this.prisma.domain.create({
        data: { name },
      });
      isNewDomain = true;
    }

    const existingLink = await this.prisma.projectDomain.findUnique({
      where: { projectId_domainId: { projectId, domainId: domain.id } },
    });

    if (existingLink) {
      throw new BadRequestException('Domain is already added to this project');
    }

    await this.prisma.projectDomain.create({
      data: {
        projectId,
        domainId: domain.id,
      },
    });

    // Fire and forget initial crawl trigger (maybe do it even if not new to catch up, but safely let's do it always)
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
              `Successfully triggered crawl for domain ${name}`,
            ),
          error: (err) =>
            this.logger.error(
              `Failed to trigger crawl for domain ${name}`,
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

    const projectDomains = await this.prisma.projectDomain.findMany({
      where: { projectId },
      include: { domain: true },
    });
    
    return projectDomains.map(pd => pd.domain);
  }

  async remove(userId: string, id: string, authorization?: string) {
    const link = await this.prisma.projectDomain.findFirst({
      where: {
        domainId: id,
        project: { members: { some: { userId } } },
      },
      include: { domain: true },
    });

    if (!link) {
      throw new NotFoundException(`Domain link not found or unauthorized`);
    }

    const member = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId: link.projectId } },
    });

    if (!member || member.role === 'VIEWER') {
      throw new UnauthorizedException(
        'You do not have permission to delete domains from this project',
      );
    }

    // 1. Delete the user's subscription to this domain
    await this.prisma.projectDomain.delete({
      where: { id: link.id },
    });

    // 2. Check if the domain is still used by other projects
    const count = await this.prisma.projectDomain.count({
      where: { domainId: id },
    });

    if (count === 0) {
      this.logger.log(`Domain ${link.domain.name} has no more subscribers. Deleting globally.`);
      // 3. Notify Search Service to delete global domain data (Typesense, BullMQ, Redis)
      try {
        const searchApiUrl =
          this.configService.get<string>('SEARCH_API_URL') ||
          'http://localhost:3002';
        await firstValueFrom(
          this.httpService.delete(
            `${searchApiUrl}/search/domains/${link.domain.name}`,
            {
              timeout: 5000,
              headers: authorization ? { authorization } : {},
            },
          ),
        );
      } catch (error) {
        this.logger.error(
          `Failed to notify Search API to delete data for domain ${link.domain.name}`,
          error instanceof Error ? error.stack : 'Unknown Error',
        );
      }

      // 4. Delete Domain from DB
      return this.prisma.domain.delete({
        where: { id },
      });
    }

    this.logger.log(`Domain ${link.domain.name} is still used by ${count} other project(s). Kept globally.`);
    return link.domain;
  }
}
