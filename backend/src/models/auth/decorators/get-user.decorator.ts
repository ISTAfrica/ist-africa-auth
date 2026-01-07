import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../types/jwt-payload.type';

export const GetUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): any => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
