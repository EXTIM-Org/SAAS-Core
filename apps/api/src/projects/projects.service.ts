import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
    });
  }

  async findOne(user: { userId: string; role?: string }, id: string) {
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    const project = await this.prisma.project.findFirst({
      where: {
        id,
        ...(isSuperAdmin
          ? {}
          : {
              members: {
                some: { userId: user.userId },
              },
            }),
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(
    user: { userId: string; role?: string },
    id: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    await this.findOne(user, id); // Ensure project exists and belongs to user

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async remove(user: { userId: string; role?: string }, id: string) {
    await this.findOne(user, id); // Ensure project exists and belongs to user

    return this.prisma.project.delete({
      where: { id },
    });
  }
}
