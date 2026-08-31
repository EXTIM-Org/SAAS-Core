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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ProjectRoles } from '../auth/decorators/project-roles.decorator';
import { ProjectRoleGuard } from '../auth/guards/project-role.guard';
import { ProjectRole } from '@saas/database';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({
    status: 201,
    description: 'The project has been successfully created.',
  })
  create(
    @CurrentUser() user: { userId: string },
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(user.userId, createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects for the current user' })
  @ApiResponse({ status: 200, description: 'Returns an array of projects.' })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.projectsService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by id' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Returns the project.' })
  @ApiResponse({
    status: 404,
    description: 'Project not found or unauthorized.',
  })
  findOne(
    @CurrentUser() user: { userId: string; role: string },
    @Param('id') id: string,
  ) {
    return this.projectsService.findOne(user, id);
  }

  @Patch(':id')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN)
  @ApiOperation({ summary: 'Update a project by id' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Returns the updated project.' })
  @ApiResponse({
    status: 404,
    description: 'Project not found or unauthorized.',
  })
  update(
    @CurrentUser() user: { userId: string; role: string },
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(user, id, updateProjectDto);
  }

  @Delete(':id')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles(ProjectRole.OWNER)
  @ApiOperation({ summary: 'Delete a project by id' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Returns the deleted project.' })
  @ApiResponse({
    status: 404,
    description: 'Project not found or unauthorized.',
  })
  remove(
    @CurrentUser() user: { userId: string; role: string },
    @Param('id') id: string,
  ) {
    return this.projectsService.remove(user, id);
  }
}
