import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ('user' | 'admin')[]) => SetMetadata(ROLES_KEY, roles);
