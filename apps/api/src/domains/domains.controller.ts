import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { DomainsService } from './domains.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('domains')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new domain' })
  @ApiResponse({ status: 201, description: 'The domain has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(
    @CurrentUser() user: { userId: string },
    @Body() createDomainDto: CreateDomainDto,
  ) {
    return this.domainsService.create(user.userId, createDomainDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all domains for a project' })
  @ApiQuery({ name: 'projectId', required: true, description: 'The ID of the project to filter domains by' })
  @ApiResponse({ status: 200, description: 'Returns an array of domains.' })
  @ApiResponse({ status: 400, description: 'projectId query parameter is required.' })
  findAll(
    @CurrentUser() user: { userId: string },
    @Query('projectId') projectId?: string,
  ) {
    if (!projectId) {
      throw new BadRequestException('projectId query parameter is required');
    }
    return this.domainsService.findAll(user.userId, projectId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a domain by id' })
  @ApiParam({ name: 'id', description: 'Domain ID' })
  @ApiResponse({ status: 200, description: 'Returns the deleted domain.' })
  @ApiResponse({ status: 404, description: 'Domain not found or unauthorized.' })
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.domainsService.remove(user.userId, id);
  }
}
