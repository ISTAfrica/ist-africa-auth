// Augment Express Request to include `user` populated by Passport strategies
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      email?: string;
      role?: string;
      [key: string]: unknown;
    };
  }
}


