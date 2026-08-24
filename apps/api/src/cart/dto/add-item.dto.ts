import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddItemDto {
  @ApiProperty({ description: 'The ID of the product to add' })
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'The quantity to add', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number = 1;
}
