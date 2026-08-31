import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectRole, GlobalRole } from '@saas/database';
import { PROJECT_ROLES_KEY } from '../decorators/project-roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(
      PROJECT_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no project roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // SUPER_ADMIN has access to everything
    if (user.role === GlobalRole.SUPER_ADMIN) {
      return true;
    }

    // Find the projectId in the request params, query, or body
    const projectId =
      request.params.projectId ||
      request.params.id ||
      request.body.projectId ||
      request.query.projectId;

    if (!projectId) {
      throw new ForbiddenException(
        'Project ID is required to access this resource',
      );
    }

    // Find the user's role in this project
    const member = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: user.userId,
          projectId: projectId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this project');
    }

    if (!requiredRoles.includes(member.role)) {
      throw new ForbiddenException(
        `Requires one of the following project roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
