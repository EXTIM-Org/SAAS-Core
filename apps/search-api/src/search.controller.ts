import { Controller, Get, Param, Query, Headers, NotFoundException, Inject } from '@nestjs/common';
import { CoreApiClientService } from './core-api-client.service';
import { Client } from 'typesense';

@Controller('search')
export class SearchController {
  constructor(
    private readonly coreApiClientService: CoreApiClientService,
    @Inject('TYPESENSE_CLIENT') private readonly typesenseClient: Client,
  ) {}

  @Get(':projectId')
  async search(
    @Param('projectId') projectId: string,
    @Query('q') q: string,
    @Headers('authorization') authorization?: string,
  ) {
    const isValid = await this.coreApiClientService.validateProject(projectId, authorization);

    if (!isValid) {
      throw new NotFoundException(`Project with ID ${projectId} not found or unauthorized`);
    }

    if (!q) {
      return { hits: [] };
    }

    const searchResults = await this.typesenseClient
      .collections('documents')
      .documents()
      .search({
        q,
        query_by: 'title,content',
        filter_by: `projectId:=${projectId}`,
      });

    return searchResults;
  }
}
