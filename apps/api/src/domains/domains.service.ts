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

    // Verify project belongs to user
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (project.userId !== userId) {
      throw new UnauthorizedException('You do not own this project');
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
    // Verify project belongs to user
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (project.userId !== userId) {
      throw new UnauthorizedException('You do not own this project');
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

    if (domain.project.userId !== userId) {
      throw new UnauthorizedException(
        'You do not own the project this domain belongs to',
      );
    }

    return this.prisma.domain.delete({
      where: { id },
    });
  }
}
