import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectRoleGuard } from '../auth/guards/project-role.guard';
import { ProjectRoles } from '../auth/decorators/project-roles.decorator';
import { ProjectRole } from '@saas/database';

@UseGuards(JwtAuthGuard, ProjectRoleGuard)
@Controller('projects/:projectId/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.EDITOR, ProjectRole.VIEWER)
  getApiKeys(@Param('projectId') projectId: string) {
    return this.apiKeysService.getApiKeys(projectId);
  }

  @Post()
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN)
  createApiKey(
    @Param('projectId') projectId: string,
    @Body('name') name: string,
  ) {
    return this.apiKeysService.createApiKey(projectId, name);
  }

  @Delete(':keyId')
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN)
  deleteApiKey(
    @Param('projectId') projectId: string,
    @Param('keyId') keyId: string,
  ) {
    return this.apiKeysService.deleteApiKey(projectId, keyId);
  }
}
