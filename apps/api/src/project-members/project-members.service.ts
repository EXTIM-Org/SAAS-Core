import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class ProjectMembersService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          }
        }
      }
    });
  }

  async addMember(addMemberDto: AddMemberDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: addMemberDto.email }
    });

    if (!user) {
      throw new NotFoundException(`User with email ${addMemberDto.email} not found`);
    }

    const existing = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: addMemberDto.projectId
        }
      }
    });

    if (existing) {
      throw new ConflictException('User is already a member of this project');
    }

    return this.prisma.projectMember.create({
      data: {
        projectId: addMemberDto.projectId,
        userId: user.id,
        role: addMemberDto.role,
      }
    });
  }

  async updateMemberRole(projectId: string, memberId: string, updateDto: UpdateMemberDto) {
    const member = await this.prisma.projectMember.findFirst({
      where: { id: memberId, projectId }
    });

    if (!member) {
      throw new NotFoundException(`Project member not found`);
    }

    // Prevent removing the last owner if we were to implement that, but for now just update
    if (member.role === 'OWNER' && updateDto.role !== 'OWNER') {
      const ownersCount = await this.prisma.projectMember.count({
        where: { projectId, role: 'OWNER' }
      });
      if (ownersCount <= 1) {
        throw new BadRequestException('Cannot change the role of the last OWNER');
      }
    }

    return this.prisma.projectMember.update({
      where: { id: memberId },
      data: { role: updateDto.role }
    });
  }

  async removeMember(projectId: string, memberId: string) {
    const member = await this.prisma.projectMember.findFirst({
      where: { id: memberId, projectId }
    });

    if (!member) {
      throw new NotFoundException(`Project member not found`);
    }

    if (member.role === 'OWNER') {
      const ownersCount = await this.prisma.projectMember.count({
        where: { projectId, role: 'OWNER' }
      });
      if (ownersCount <= 1) {
        throw new BadRequestException('Cannot remove the last OWNER');
      }
    }

    return this.prisma.projectMember.delete({
      where: { id: memberId }
    });
  }
}
