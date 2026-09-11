import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { UserPayload } from '@saas/shared';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: any }>();
    if (!request.user) {
      return null;
    }
    if (data) {
      return request.user[data] ?? (data === 'userId' ? (request.user.id ?? request.user.sub) : undefined);
    }
    return request.user;
  },
);
