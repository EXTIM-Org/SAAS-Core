import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Product } from '@saas/database';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private async syncWithSearchService(product: Product) {
    try {
      const searchApiUrl =
        this.configService.get<string>('SEARCH_API_URL') ||
        'http://localhost:3002';

      const payload = {
        productId: product.id,
        projectId: product.projectId,
        name: product.name,
        description: product.description,
        price: product.price ? Number(product.price) : undefined,
      };

      await firstValueFrom(
        this.httpService.post(`${searchApiUrl}/search/ingest/product`, payload, {
          timeout: 5000,
        })
      );
      this.logger.log(`Successfully queued product ${product.id} for indexing`);
    } catch (error) {
      this.logger.error(
        `Failed to sync product ${product.id} with search service`,
        error instanceof Error ? error.stack : 'Unknown Error',
      );
    }
  }

  async create(userId: string, createProductDto: CreateProductDto) {
    const { projectId, ...productData } = createProductDto;

    // Verify project belongs to user
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (project.userId !== userId) {
      throw new UnauthorizedException('You do not own this project');
    }

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        projectId,
      },
    });

    // Fire and forget
    this.syncWithSearchService(product).catch(() => {});

    return product;
  }

  async findAll(userId: string, projectId: string) {
    // Verify project belongs to user
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (project.userId !== userId) {
      throw new UnauthorizedException('You do not own this project');
    }

    return this.prisma.product.findMany({
      where: { projectId },
    });
  }

  async findOne(userId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        project: {
          userId,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found or you do not have access`);
    }

    return product;
  }

  async update(
    userId: string,
    id: string,
    updateProductDto: UpdateProductDto,
  ) {
    const { projectId, ...updateData } = updateProductDto;

    // Check if product exists and belongs to a project owned by the user
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        project: {
          userId,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found or you do not have access`);
    }

    // If attempting to change projectId, verify the new project belongs to the user
    if (projectId && projectId !== product.projectId) {
      const newProject = await this.prisma.project.findFirst({
        where: {
          id: projectId,
          userId,
        },
      });

      if (!newProject) {
        throw new UnauthorizedException(
          'You do not own the target project for this product update or it does not exist',
        );
      }
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        ...(projectId && { projectId }), // conditionally add projectId
      },
    });

    // Fire and forget
    this.syncWithSearchService(updatedProduct).catch(() => {});

    return updatedProduct;
  }

  async remove(userId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        project: {
          userId,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found or you do not have access`);
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
