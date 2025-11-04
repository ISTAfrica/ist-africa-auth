import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // no specific role required
    }

    // ✅ Explicitly type the request as Express.Request
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    // ✅ Safely access the user object
    const user = request.user;

    if (!user) {
      return false;
    }

    // Support either a primitive role string (from strategy) or nested role object
    const userWithPossibleRole = user as unknown as {
      role?: { name?: string } | string;
    };
    const userRoleName =
      typeof userWithPossibleRole.role === 'string'
        ? userWithPossibleRole.role
        : userWithPossibleRole.role?.name;
    if (!userRoleName) {
      return false;
    }

    return requiredRoles.includes(userRoleName);
  }
}
