import { IsEnum } from 'class-validator';
import { ProjectRole } from '@saas/database';

export class UpdateMemberDto {
  @IsEnum(ProjectRole)
  role!: ProjectRole;
}
