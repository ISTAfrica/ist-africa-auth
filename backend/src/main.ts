import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import session = require('express-session');
import { Client } from './models/clients/entities/client.entity';

async function bootstrap() {
  console.log('JWT_PRIVATE_KEY on startup:', process.env.JWT_PRIVATE_KEY);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 600000, 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.useStaticAssets(join(__dirname, '..', 'public', 'widget'), {
    prefix: '/sdk/',
  });

  // Static origins (IAA's own frontend)
  const staticOrigins = [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:3001',
  ];

  // Iframe security — only allow registered client origins to embed IAA
  app.use(async (req: any, res: any, next: any) => {
    try {
      const allClients = await Client.findAll({
        where: { status: 'active' },
        attributes: ['allowed_origins'],
      });
      const clientOrigins = allClients.flatMap((c: any) => c.allowed_origins || []);
      const allowedFrameAncestors = ["'self'", ...staticOrigins, ...clientOrigins].join(' ');
      res.setHeader('Content-Security-Policy', 'frame-ancestors ' + allowedFrameAncestors);
    } catch (e) {
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    }
    next();
  });

  app.enableCors({
    origin: async (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);

      // Allow static origins
      if (staticOrigins.includes(origin)) return callback(null, true);

      // Check registered client allowed_origins
      try {
        const allClients = await Client.findAll({
          where: { status: 'active' },
          attributes: ['allowed_origins'],
        });
        const clientOrigins = allClients.flatMap((c) => c.allowed_origins || []);
        if (clientOrigins.includes(origin)) return callback(null, true);
      } catch (err) {
        console.error('CORS origin check failed:', err);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
