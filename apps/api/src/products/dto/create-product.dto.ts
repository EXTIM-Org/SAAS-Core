import { IsString, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Name of the product' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Description of the product' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price of the product' })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ description: 'Inventory count of the product' })
  @IsNumber()
  @Min(0)
  inventoryCount!: number;

  @ApiProperty({ description: 'Project ID this product belongs to' })
  @IsUUID()
  projectId!: string;

  @ApiPropertyOptional({ description: 'Category ID this product belongs to' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
