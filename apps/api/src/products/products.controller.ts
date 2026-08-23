import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(
    @CurrentUser() user: { userId: string },
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(user.userId, createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products for a project' })
  @ApiQuery({
    name: 'projectId',
    required: true,
    description: 'The ID of the project to filter products by',
  })
  @ApiResponse({ status: 200, description: 'Returns an array of products.' })
  @ApiResponse({
    status: 400,
    description: 'projectId query parameter is required.',
  })
  findAll(
    @CurrentUser() user: { userId: string },
    @Query('projectId') projectId?: string,
  ) {
    if (!projectId) {
      throw new BadRequestException('projectId query parameter is required');
    }
    return this.productsService.findAll(user.userId, projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Returns the product.' })
  @ApiResponse({
    status: 404,
    description: 'Product not found or unauthorized.',
  })
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.productsService.findOne(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product by id' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully updated.',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found or unauthorized.',
  })
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(user.userId, id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product by id' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Returns the deleted product.' })
  @ApiResponse({
    status: 404,
    description: 'Product not found or unauthorized.',
  })
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.productsService.remove(user.userId, id);
  }
}
