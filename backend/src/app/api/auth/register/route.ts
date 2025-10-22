import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

const registerUserSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
});

const json = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registerUserSchema.safeParse(body);

    if (!validation.success) {
      return json(
        { message: 'Invalid request payload', errors: validation.error.issues },
        { status: 400 },
      );
    }

    const { email, password, name } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return json(
        { message: 'User with this email already exists' },
        { status: 409 }, // 409 Conflict
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword },
    });

    // Omit password from the response
    const { password: _, ...userWithoutPassword } = user;

    return json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Registration Error:', error);
    return json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}