import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard'; // Assuming you have this from previous steps

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Run the standard JWT authentication first
    await super.canActivate(context);

    // 2. Get the user object attached to the request by JwtAuthGuard
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('USER RECEIVED BY ADMIN GUARD:', user);

    // 3. Check for the 'admin' role
    if (user && user.role === 'admin') {
      return true; // User is an admin, allow access
    }

    // 4. If not an admin, deny access
    throw new ForbiddenException('Admin privileges required');
  }
}