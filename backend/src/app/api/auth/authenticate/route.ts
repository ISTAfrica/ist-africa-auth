import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';
import { SignJWT } from 'jose';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const prisma = new PrismaClient();

const authenticateSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const json = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });

const getPrivateKey = () => {
  const privateKey = process.env.JWT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('JWT_PRIVATE_KEY is not set in environment variables');
  }
  return Buffer.from(privateKey.replace(/\\n/g, '\n'), 'utf8');
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = authenticateSchema.safeParse(body);

    if (!validation.success) {
      return json({ message: 'Invalid payload' }, { status: 400 });
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return json({ message: 'User not found' }, { status: 404 });
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      return json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const privateKey = await getPrivateKey();
    const keyId = process.env.JWT_KEY_ID!;

 
    const accessToken = await new SignJWT({ user_type: 'admin_user' })
      .setProtectedHeader({ alg: 'RS256', kid: keyId })
      .setIssuer('https://auth.ist.africa')
      .setAudience('iaa-admin-portal')
      .setSubject(user.id.toString())
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);

    
    const refreshToken = randomUUID();
    const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.refreshToken.create({
      data: {
        hashedToken: refreshToken, // In a real scenario, you'd hash this too
        userId: user.id,
      },
    });

    return json({ accessToken, refreshToken });
  } catch (error) {
    console.error('Authentication Error:', error);
    return json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}