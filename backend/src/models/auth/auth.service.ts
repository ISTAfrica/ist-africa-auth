import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { hash, compare } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(registerDto: RegisterUserDto) {
    const { email, password, name } = registerDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await hash(password, 12);
    const user = await this.prisma.user.create({
      data: { email, name, password: hashedPassword },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async authenticate(authenticateDto: AuthenticateUserDto) {
    const { email, password } = authenticateDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    try {
      const { SignJWT, importPKCS8 } = await import('jose');

      const privateKeyPem = process.env.JWT_PRIVATE_KEY!.replace(/\\n/g, '\n');
      const privateKey = await importPKCS8(privateKeyPem, 'RS256');
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
      await this.prisma.refreshToken.create({
        data: { hashedToken: refreshToken, userId: user.id },
      });

      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Token Generation Error:', error);
      throw new InternalServerErrorException('Could not generate tokens');
    }
  }

  async getJwks() {
    try {
      const { importSPKI, exportJWK } = await import('jose');

      const publicKeyPem = process.env.JWT_PUBLIC_KEY!.replace(/\\n/g, '\n');
      const keyId = process.env.JWT_KEY_ID!;
      const ecPublicKey = await importSPKI(publicKeyPem, 'RS256');
      const jwk = await exportJWK(ecPublicKey);

      return {
        keys: [{ ...jwk, kid: keyId, use: 'sig', alg: 'RS256' }],
      };
    } catch (error) {
      console.error('JWKS Error:', error);
      throw new InternalServerErrorException('Could not generate JWKS');
    }
  }
}