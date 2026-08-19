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
import { DomainsService } from './domains.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() createDomainDto: CreateDomainDto,
  ) {
    return this.domainsService.create(user.userId, createDomainDto);
  }

  @Get()
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
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.domainsService.remove(user.userId, id);
  }
}
