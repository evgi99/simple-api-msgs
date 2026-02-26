import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export interface CurrentUserPayload {
  id: string;
  email: string;
}

/**
 * Injects the current authenticated user from the request.
 * Use only on routes protected by JwtAuthGuard; throws 401 if user is missing.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  },
);
