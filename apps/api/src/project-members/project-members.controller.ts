import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ProjectMembersService } from './project-members.service';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectRoleGuard } from '../auth/guards/project-role.guard';
import { ProjectRoles } from '../auth/decorators/project-roles.decorator';
import { ProjectRole } from '@saas/database';

@ApiTags('project-members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProjectRoleGuard)
@Controller('projects/:projectId/members')
export class ProjectMembersController {
  constructor(private readonly membersService: ProjectMembersService) {}

  @Get()
  @ProjectRoles(
    ProjectRole.OWNER,
    ProjectRole.ADMIN,
    ProjectRole.EDITOR,
    ProjectRole.VIEWER,
  )
  @ApiOperation({ summary: 'Get all members of a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  findAll(@Param('projectId') projectId: string) {
    return this.membersService.findAll(projectId);
  }

  @Post()
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN)
  @ApiOperation({ summary: 'Add a new member to the project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  addMember(
    @Param('projectId') projectId: string,
    @Body() addMemberDto: Omit<AddMemberDto, 'projectId'>,
  ) {
    return this.membersService.addMember({ ...addMemberDto, projectId });
  }

  @Patch(':memberId')
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN)
  @ApiOperation({ summary: 'Update a member role' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  updateRole(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateMemberDto,
  ) {
    return this.membersService.updateMemberRole(projectId, memberId, updateDto);
  }

  @Delete(':memberId')
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN)
  @ApiOperation({ summary: 'Remove a member from the project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  removeMember(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.removeMember(projectId, memberId);
  }
}
