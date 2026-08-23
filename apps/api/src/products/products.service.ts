import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.product.create({
      data: {
        ...productData,
        projectId,
      },
    });
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

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        ...(projectId && { projectId }), // conditionally add projectId
      },
    });
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
