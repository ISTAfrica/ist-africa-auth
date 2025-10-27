import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { hash, compare } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { EmailService } from '../../email/email.service';
import { randomInt } from 'crypto'; 
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  private async generateAndSaveOtp(userId: number, name: string, email: string) {
    const otp = randomInt(100000, 999999).toString(); 
    const hashedOtp = await hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    await this.prisma.user.update({
      where: { id: userId },
      data: { otp: hashedOtp, otpExpiresAt },
    });

    await this.emailService.sendOtpEmail(name, email, otp);
  }


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

    await this.generateAndSaveOtp(user.id, user.name || 'User', user.email);

    return {
      message: 'Registration successful. Please check your email for your 6-digit verification code.',
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.otp || !user.otpExpiresAt) {
      throw new NotFoundException('Invalid request or user not found.');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new UnauthorizedException('OTP has expired. Please request a new one.');
    }

    const isOtpValid = await compare(otp, user.otp);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otp: null,
        otpExpiresAt: null,
      },
    });

    return { message: 'Email verified successfully. You can now log in.' };
  }


  async authenticate(authenticateDto: AuthenticateUserDto) {
    const { email, password } = authenticateDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

     if (!user.isVerified) {
      throw new ForbiddenException('Please verify your email before logging in.');
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

  async resendOtp(resendOtpDto: ResendOtpDto) {
    const { email } = resendOtpDto;
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.isVerified) {
      throw new ConflictException('This account is already verified.');
    }

    await this.generateAndSaveOtp(user.id, user.name || 'User', user.email);
    
    return { message: 'A new verification code has been sent to your email.' };
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

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new NotFoundException('Invalid verification token.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null, 
      },
    });

    return { message: 'Email verified successfully. You can now log in.' };
  }

}

