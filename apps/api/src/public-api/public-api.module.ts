import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ProjectsModule } from '../projects/projects.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ApiKeysModule, ProjectsModule, HttpModule],
  controllers: [PublicApiController],
})
export class PublicApiModule {}
