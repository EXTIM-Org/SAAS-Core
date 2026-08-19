import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateDomainDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  @IsNotEmpty()
  projectId!: string;
}
