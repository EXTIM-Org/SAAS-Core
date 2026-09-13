import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable, lastValueFrom } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = super.canActivate(context);
    let isValid = false;
    
    if (result instanceof Promise) {
      isValid = await result;
    } else if (result instanceof Observable) {
      isValid = await lastValueFrom(result);
    } else {
      isValid = result as boolean;
    }

    if (!isValid) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // If a SUPPORT user is impersonating someone else, they only get GET access globally
    if (user?.impersonatorRole === 'SUPPORT' && request.method !== 'GET') {
      throw new ForbiddenException('Support users have read-only access, even when impersonating');
    }

    return true;
  }
}
