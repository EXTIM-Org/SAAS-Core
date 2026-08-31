import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDomainDto } from './dto/create-domain.dto';

@Injectable()
export class DomainsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createDomainDto: CreateDomainDto) {
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

    return this.prisma.domain.create({
      data: {
        name,
        projectId,
      },
    });
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

  async remove(userId: string, id: string) {
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

    return this.prisma.domain.delete({
      where: { id },
    });
  }
}
