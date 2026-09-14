import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { ProjectsService } from '../projects/projects.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@UseGuards(ApiKeyGuard)
@Controller('public/v1')
export class PublicApiController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Get('info')
  async getProjectInfo(@Req() req: any) {
    const projectId = req.projectId;
    // We can use an existing method or prisma directly. Since ProjectsService has findOne but requires userId, 
    // it's better to fetch it via a new method or just use prisma in a real scenario. 
    // For now, let's inject PrismaService if needed, but since it's not injected, let's just 
    // return what we know from the API key.
    
    return {
      projectId,
      message: 'Authentication successful. You have access to this project.',
      apiKeyName: req.apiKeyInfo.name,
    };
  }

  @Get('search')
  async search(@Req() req: any, @Query('q') q: string) {
    const projectId = req.projectId;
    if (!q) {
      return [];
    }

    const searchApiUrl =
      this.configService.get<string>('SEARCH_API_URL') ||
      'http://localhost:3002';

    try {
      // The search service exposes /search/public/:projectId/search
      const response = await firstValueFrom(
        this.httpService.get(`${searchApiUrl}/search/public/${projectId}/search`, {
          params: { q },
        }),
      );
      return response.data;
    } catch (error) {
      console.error('Error proxying search to search-api:', error);
      throw new NotFoundException('Failed to execute search');
    }
  }

  @Get('products/search')
  async searchProducts(
    @Req() req: any,
    @Query('q') q: string,
    @Query('min_price') minPrice?: string,
    @Query('max_price') maxPrice?: string,
    @Query('brand') brand?: string,
    @Query('in_stock') inStock?: string,
  ) {
    const projectId = req.projectId;
    if (!q) {
      return { results: [], facets: [] };
    }

    const searchApiUrl =
      this.configService.get<string>('SEARCH_API_URL') ||
      'http://localhost:3002';

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${searchApiUrl}/search/public/${projectId}/products/search`,
          {
            params: {
              q,
              min_price: minPrice,
              max_price: maxPrice,
              brand,
              in_stock: inStock,
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      console.error('Error proxying product search to search-api:', error);
      throw new NotFoundException('Failed to execute product search');
    }
  }
}
