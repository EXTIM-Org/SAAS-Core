import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessCheckoutDto {
  @ApiProperty({ description: 'The project ID associated with this checkout' })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  projectId!: string;
}
