import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateDomainDto {
  @ApiProperty({
    description: 'Auto crawl interval in days',
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  autoCrawlIntervalDays?: number;
}
