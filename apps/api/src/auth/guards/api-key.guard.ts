import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'];

    if (!apiKeyHeader) {
      throw new UnauthorizedException('API key is missing');
    }

    const apiKey = await this.apiKeysService.validateApiKey(apiKeyHeader);
    
    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Attach project info to the request for the controller to use
    request.projectId = apiKey.projectId;
    request.apiKeyInfo = apiKey;

    return true;
  }
}
