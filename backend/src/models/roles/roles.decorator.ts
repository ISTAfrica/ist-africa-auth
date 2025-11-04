import { SetMetadata } from '@nestjs/common';

/**
 * Custom decorator to define which roles can access a route.
 * Usage:
 *    @Roles('admin')
 *    @Roles('user', 'admin')
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
