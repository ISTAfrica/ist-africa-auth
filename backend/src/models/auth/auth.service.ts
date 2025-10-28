import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';
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
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(RefreshToken)
    private readonly refreshTokenModel: typeof RefreshToken,
    private emailService: EmailService,
  ) {}

  // private async generateAndSaveOtp(userId: number, name: string, email: string) {
  //   const otp = randomInt(100000, 999999).toString(); 
  //   const hashedOtp = await hash(otp, 10);
  //   const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 

  //   await this.userModel.update(
  //     { otp: hashedOtp, otpExpiresAt },
  //     { where: { id: userId } },
  //   );

  //   await this.emailService.sendOtpEmail(name, email, otp);
  // }


  async register(registerDto: RegisterUserDto) {
    const { email, password, name } = registerDto;

    const existingUser = await this.userModel.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await hash(password, 12);

    const verificationToken = randomUUID();
    const user = await this.userModel.create({
      email,
      name: name || '',
      password: hashedPassword,
      verificationToken,
    });

    const verifyUrlBase = process.env.BACKEND_URL ?? process.env.APP_URL ?? 'http://localhost:5000';
    const verifyUrl = `${verifyUrlBase.replace(/\/$/, '')}/api/auth/verify-email?token=${verificationToken}`;

    await this.emailService.sendVerificationEmail(user.name || 'User', user.email, verifyUrl);

    return {
      message: 'Registration successful. Please check your email to verify.',
      redirectUrl: `${(process.env.FRONTEND_URL ?? process.env.NEXT_PUBLIC_FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '')}/auth/verify-email`,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const user = await this.userModel.findOne({ where: { email } });

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

    await this.userModel.update(
      { isVerified: true, otp: null, otpExpiresAt: null },
      { where: { id: user.id } },
    );

    return { message: 'Email verified successfully. You can now log in.' };
  }


  async authenticate(authenticateDto: AuthenticateUserDto) {
    const { email, password } = authenticateDto;

    const user = await this.userModel.findOne({ where: { email } });
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
      await this.refreshTokenModel.create({
        hashedToken: refreshToken,
        userId: user.id,
      });

      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Token Generation Error:', error);
      throw new InternalServerErrorException('Could not generate tokens');
    }
  }

  async resendOtp(resendOtpDto: ResendOtpDto) {
    const { email } = resendOtpDto;
    const user = await this.userModel.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.isVerified) {
      throw new ConflictException('This account is already verified.');
    }

    const verifyUrlBase = process.env.BACKEND_URL ?? process.env.APP_URL ?? 'http://localhost:5000';
    const verifyUrl = `${verifyUrlBase.replace(/\/$/, '')}/api/auth/verify-email?token=${user.verificationToken}`;
    await this.emailService.sendVerificationEmail(user.name || 'User', user.email, verifyUrl);
    
    return { message: 'Verification link sent to your email.' };
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
    const user = await this.userModel.findOne({ where: { verificationToken: token } });

    if (!user) {
      throw new NotFoundException('Invalid verification token.');
    }

    await this.userModel.update(
      { isVerified: true, verificationToken: null },
      { where: { id: user.id } },
    );

    return { message: 'Email verified successfully. You can now log in.' };
  }

}
