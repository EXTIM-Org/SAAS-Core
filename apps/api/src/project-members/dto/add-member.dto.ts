import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ProjectRole } from '@saas/database';

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsEnum(ProjectRole)
  role!: ProjectRole;
}
