import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Admin } from '../entities/admin.entity';

export const CurrentAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Admin => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
