import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

type RequestWithUser = Request & { user?: unknown };

export const getCurrentUser = (ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
};

export const CurrentUser = createParamDecorator<unknown>(
    (_: unknown, ctx: ExecutionContext): unknown => getCurrentUser(ctx),
);
