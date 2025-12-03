import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { hash, compare } from 'bcryptjs';
import { randomUUID, randomInt, randomBytes } from 'crypto';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { EmailService } from '../../email/email.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ConfigService } from '@nestjs/config';
import { Client } from '../clients/entities/client.entity';
import { AuthorizationCode } from './entities/authorization-code.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(RefreshToken)
    private readonly refreshTokenModel: typeof RefreshToken,
    @InjectModel(Client) private readonly clientModel: typeof Client,
    @InjectModel(AuthorizationCode)
    private readonly authCodeModel: typeof AuthorizationCode,
    private readonly configService: ConfigService,
    private emailService: EmailService,
  ) {}

  // -------------------- OTP Utility --------------------
  private async generateAndSaveOtp(userId: number): Promise<string> {
    const otp = randomInt(100000, 999999).toString();
    const hashedOtp = await hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.userModel.update(
      { otp: hashedOtp, otpExpiresAt },
      { where: { id: userId } },
    );

    return otp;
  }

  // -------------------- Register --------------------
  async register(registerDto: RegisterUserDto) {
    const { email, password, name } = registerDto;

    const existingUser = await this.userModel.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const domainsEnv = this.configService.get<string>('IST_DOMAINS') || '';
    const istDomains = domainsEnv
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter((d) => d.length > 0);

    const emailDomain = email.split('@')[1]?.toLowerCase();
    const membershipStatus = istDomains.includes(emailDomain)
      ? 'ist_member'
      : 'ext_member';

    const hashedPassword = await hash(password, 12);
    const verificationToken = randomUUID();

    const user = await this.userModel.create({
      email,
      name: name || '',
      password: hashedPassword,
      verificationToken,
      membershipStatus,
      role: 'user',
    });

    const verifyUrlBase =
      process.env.BACKEND_URL ?? process.env.APP_URL ?? 'http://localhost:5000';
    const verifyUrl = `${verifyUrlBase.replace(
      /\/$/,
      '',
    )}/api/auth/verify-email?token=${verificationToken}`;

    const otp = await this.generateAndSaveOtp(user.id);
    await this.emailService.sendVerificationEmail(
      user.name || 'User',
      user.email,
      verifyUrl,
      otp,
    );

    return {
      message: 'Registration successful. Please check your email to verify.',
      redirectUrl: `${(
        process.env.FRONTEND_URL ??
        process.env.NEXT_PUBLIC_FRONTEND_URL ??
        'http://localhost:3000'
      ).replace(/\/$/, '')}/auth/verify-email`,
    };
  }

  // -------------------- Role Update --------------------
  async updateUserRole(
    callerRole: 'user' | 'admin' | 'admin_user',
    userId: number,
    newRole: 'user' | 'admin',
  ) {
    if (callerRole !== 'admin' && callerRole !== 'admin_user') {
      throw new ForbiddenException('Only admins can update user roles');
    }

    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    await user.update({ role: newRole });

    return {
      message: `User role updated to ${newRole}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // -------------------- OTP Verification --------------------
  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const user = await this.userModel.findOne({ where: { email } });
    if (!user || !user.otp || !user.otpExpiresAt) {
      throw new NotFoundException('Invalid request or user not found.');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new UnauthorizedException(
        'OTP has expired. Please request a new one.',
      );
    }

    const isOtpValid = await compare(otp, user.otp);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP.');
    }

    await this.userModel.update(
      { isVerified: true, otp: null, otpExpiresAt: null },
      { where: { id: user.id } },
    );

    const { accessToken, refreshToken } = await this.issueTokens(
      user.id,
      user.role,
    );
    return {
      message: 'Email verified successfully.',
      accessToken,
      refreshToken,
    };
  }

  // -------------------- Authenticate --------------------
  async authenticate(authenticateDto: AuthenticateUserDto) {
    const { email, password, client_id, redirect_uri, state } = authenticateDto;

    const user = await this.userModel.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.isVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in.',
      );
    }
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (client_id && redirect_uri) {
      console.log(
        `[AuthService] Detected OAuth2 Authorization Code flow for client: ${client_id}`,
      );

      const client = await this.clientModel.findOne({ where: { client_id } });
      if (!client) {
        throw new BadRequestException(
          'Unauthorized client: This application is not registered.',
        );
      }
      if (client.redirect_uri !== redirect_uri) {
        throw new BadRequestException(
          'Invalid redirect URI: The provided redirect URI does not match the one registered for this client.',
        );
      }

      const code = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await this.authCodeModel.create({
        code,
        expiresAt,
        userId: user.id,
        clientId: client.id,
      });

      const iaaFrontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      );

      const finalRedirectUri = new URL(`${iaaFrontendUrl}/auth/callback`);
      finalRedirectUri.searchParams.append('code', code);
      if (state) {
        finalRedirectUri.searchParams.append('state', state);
      }

      return {
        redirect_uri: finalRedirectUri.toString(),
      };
    } else {
      console.log(
        `[AuthService] Detected Direct Login (Password Grant) flow for user: ${email}`,
      );
      return this.issueTokens(user.id, user.role);
    }
  }

  // -------------------- LinkedIn Login --------------------
  async linkedinLogin(profile: {
    linkedinId: string;
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  }) {
    // 1. Find the user by their LinkedIn ID (Primary check)
    let user = await this.userModel.findOne({
      where: { linkedinId: profile.linkedinId },
    });

    if (user) {
      await user.update({
        profilePicture: profile.picture,
      });
    }

    // 2. If not found, attempt to find by email for account linking
    if (!user && profile.email) {
      const userByEmail = await this.userModel.findOne({
        where: { email: profile.email },
      });

      if (userByEmail) {
        // User exists via email, link the LinkedIn ID
        await userByEmail.update({
          linkedinId: profile.linkedinId,
          profilePicture: profile.picture,
          isVerified: true,
        });
        user = userByEmail;
      }
    }

    // 3. If still no user, create a new account
    if (!user) {
      const fullName =
        `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
        'LinkedIn User';

      // Determine membership status based on email domain
      const domainsEnv = this.configService.get<string>('IST_DOMAINS') || '';
      const istDomains = domainsEnv
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter((d) => d.length > 0);

      const emailDomain = profile.email?.split('@')[1]?.toLowerCase();
      const membershipStatus = istDomains.includes(emailDomain)
        ? 'ist_member'
        : 'ext_member';

      user = await this.userModel.create({
        linkedinId: profile.linkedinId,
        email: profile.email,
        name: fullName,
        profilePicture: profile.picture,
        isVerified: true,
        role: 'user',
        password: '',
        membershipStatus,
        verificationToken: null,
        otp: null,
        otpExpiresAt: null,
      });

      console.log(
        `[AuthService] New LinkedIn user created with ID: ${user.id}`,
      );
    }

    // 4. Issue tokens and return
    const { accessToken, refreshToken } = await this.issueTokens(
      user.id,
      user.role,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        membershipStatus: user.membershipStatus,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
      },
    };
  }

  // -------------------- Resend OTP --------------------
  async resendOtp(resendOtpDto: ResendOtpDto) {
    const { email } = resendOtpDto;
    const user = await this.userModel.findOne({ where: { email } });

    if (!user) throw new NotFoundException('User not found.');
    if (user.isVerified)
      throw new ConflictException('This account is already verified.');

    const verifyUrlBase = this.configService.get<string>('BACKEND_URL');
    if (!verifyUrlBase) {
      throw new InternalServerErrorException(
        'Configuration error: BACKEND_URL is not set in environment variables.',
      );
    }

    const verifyUrl = `${verifyUrlBase.replace(/\/$/, '')}/api/auth/verify-email?token=${user.verificationToken}`;
    const otp = await this.generateAndSaveOtp(user.id);
    await this.emailService.sendVerificationEmail(
      user.name || 'User',
      user.email,
      verifyUrl,
      otp,
    );

    return { message: 'Verification link sent to your email.' };
  }

  // -------------------- Verify Email --------------------
  async verifyEmail(token: string) {
    const user = await this.userModel.findOne({
      where: { verificationToken: token },
    });
    if (!user) throw new NotFoundException('Invalid verification token.');

    await this.userModel.update(
      { isVerified: true, verificationToken: null },
      { where: { id: user.id } },
    );

    return this.issueTokens(user.id, user.role);
  }

  // -------------------- JWKS --------------------
  async getJwks() {
    try {
      const { importSPKI, exportJWK } = await import('jose');
      const publicKeyPem = process.env.JWT_PUBLIC_KEY!.replace(/\\n/g, '\n');
      const keyId = process.env.JWT_KEY_ID!;
      const ecPublicKey = await importSPKI(publicKeyPem, 'RS256');
      const jwk = await exportJWK(ecPublicKey);
      return { keys: [{ ...jwk, kid: keyId, use: 'sig', alg: 'RS256' }] };
    } catch (error) {
      console.error('JWKS Error:', error);
      throw new InternalServerErrorException('Could not generate JWKS');
    }
  }

  // -------------------- Refresh Tokens --------------------
  async refreshTokens(refreshToken: string) {
    const tokens = await this.refreshTokenModel.findAll();
    let matched: RefreshToken | null = null;

    for (const t of tokens) {
      const match = await compare(refreshToken, t.hashedToken);
      if (match) {
        matched = t;
        break;
      }
    }

    if (!matched)
      throw new UnauthorizedException('Invalid or expired refresh token.');

    const user = await this.userModel.findByPk(matched.userId);
    if (!user) throw new NotFoundException('User not found for this token.');

    await this.refreshTokenModel.destroy({ where: { id: matched.id } });

    return this.issueTokens(user.id, user.role);
  }

  // -------------------- Token Helper --------------------
  private async issueTokens(userId: number, role: 'user' | 'admin') {
    try {
      const { SignJWT, importPKCS8 } = await import('jose');
      const privateKeyPem = process.env.JWT_PRIVATE_KEY!.replace(/\\n/g, '\n');
      const privateKey = await importPKCS8(privateKeyPem, 'RS256');
      const keyId = process.env.JWT_KEY_ID!;

      const accessToken = await new SignJWT({ role })
        .setProtectedHeader({ alg: 'RS256', kid: keyId })
        .setIssuer('https://auth.ist.africa')
        .setAudience('iaa-admin-portal')
        .setSubject(userId.toString())
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey);

      const refreshToken = randomUUID();
      const hashedRefresh = await hash(refreshToken, 12);
      const now = new Date();
      const ttl = Number(
        this.configService.get('REFRESH_TOKEN_TTL_DAYS') ?? 30,
      );
      const expiresAt = new Date(now);
      expiresAt.setDate(now.getDate() + ttl);

      await this.refreshTokenModel.create({
        hashedToken: hashedRefresh,
        userId,
        expiresAt,
      });

      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Token Generation Error:', error);
      throw new InternalServerErrorException('Could not generate tokens');
    }
  }
}
