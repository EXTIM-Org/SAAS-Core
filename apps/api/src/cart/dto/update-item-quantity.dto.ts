import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateItemQuantityDto {
  @ApiProperty({ description: 'The new quantity for the item' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity!: number;
}
