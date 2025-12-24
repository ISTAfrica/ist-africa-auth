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
import { ClientCredentialsDto } from './dto/client-credentials.dto';
import { JwtTokenIssuer } from '../../utils/token';
import { JwtTokenIssuerImpl } from '../../utils/implementation/jwt-token.issuer';
import { ClientAppToken } from './entities/client-app-token.entity';
import { AuthorizationCode } from './entities/authorization-code.entity';

@Injectable()
export class AuthService {
  getJwks() {
    throw new Error('Method not implemented.');
  }
  private readonly jwtTokenIssuer: JwtTokenIssuer;

  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(RefreshToken)
    private readonly refreshTokenModel: typeof RefreshToken,
    @InjectModel(Client) private readonly clientModel: typeof Client,
    @InjectModel(ClientAppToken)
    private readonly clientAppTokenModel: typeof ClientAppToken,
    @InjectModel(AuthorizationCode)
    private readonly authCodeModel: typeof AuthorizationCode,
    private readonly configService: ConfigService,
    private emailService: EmailService,
  ) {
    this.jwtTokenIssuer = new JwtTokenIssuerImpl(
      this.configService,
      this.refreshTokenModel,
    );
  }

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

    const tokens = await this.jwtTokenIssuer.issueTokens({
      email: user.email,
      password: user.password,
      userId: user.id,
      role: user.role,
      name: user.name,
    });

    return {
      message: 'Email verified successfully.',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // -------------------- Authenticate --------------------
  async authenticate(authenticateDto: AuthenticateUserDto) {
    const { email, password, client_id, redirect_uri, state } = authenticateDto;

    const user = await this.userModel.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.isVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in.',
      );
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // -------------------- OAuth2 Authorization Code Flow --------------------
    if (client_id && redirect_uri) {
      const client = await this.clientModel.findOne({ where: { client_id } });
      if (!client) {
        throw new BadRequestException(
          'Unauthorized client: This application is not registered.',
        );
      }
      if (client.redirect_uri !== redirect_uri) {
        throw new BadRequestException(
          `Invalid redirect URI: Expected ${client.redirect_uri}, got: ${redirect_uri}`,
        );
      }
      if (client.status !== 'active') {
        throw new BadRequestException('Client application is not active.');
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
      if (state) finalRedirectUri.searchParams.append('state', state);

      return {
        redirect_uri: finalRedirectUri.toString(),
      };
    }

    // -------------------- Direct Login (Password Grant) --------------------
    return this.jwtTokenIssuer.issueTokens({
      email: user.email,
      password: user.password,
      userId: user.id,
      role: user.role,
      name: user.name,
    });
  }

  // -------------------- Resend OTP --------------------
  async resendOtp(resendOtpDto: ResendOtpDto) {
    const { email } = resendOtpDto;
    const user = await this.userModel.findOne({ where: { email } });

    if (!user) throw new NotFoundException('User not found.');
    if (user.isVerified)
      throw new ConflictException('This account is already verified.');

    const verifyUrlBase = this.configService.get<string>('BACKEND_URL');
    if (!verifyUrlBase)
      throw new InternalServerErrorException(
        'BACKEND_URL is not set in environment variables.',
      );

    const verifyUrl = `${verifyUrlBase.replace(
      /\/$/,
      '',
    )}/api/auth/verify-email?token=${user.verificationToken}`;

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

    return this.jwtTokenIssuer.issueTokens({
      email: user.email,
      password: user.password,
      userId: user.id,
      role: user.role,
      name: user.name,
    });
  }

 
  // -------------------- Refresh Tokens --------------------
  async refreshTokens(refreshToken: string) {
    const storedTokens = await this.refreshTokenModel.findAll();
    let matched: RefreshToken | null = null;

    for (const t of storedTokens) {
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

    return this.jwtTokenIssuer.issueTokens({
      email: user.email,
      password: user.password,
      userId: user.id,
      role: user.role,
      name: user.name,
    });
  }

  // -------------------- Auth Code Token Exchange --------------------
  async exchangeAuthCode(code: string, credentials: ClientCredentialsDto) {
    const { client_id, client_secret } = credentials;

    // 1. Validate client credentials
    const client = await this.clientModel.findOne({ where: { client_id } });
    if (!client) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    const isClientSecretValid = await compare(
      client_secret,
      client.client_secret,
    );
    if (!isClientSecretValid) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    // 2. Validate authorization code
    const authCode = await this.authCodeModel.findOne({ where: { code } });
    if (!authCode) {
      throw new UnauthorizedException('Invalid authorization code');
    }

    // 3. Check expiry
    if (authCode.expiresAt.getTime() <= Date.now()) {
      await this.authCodeModel.destroy({ where: { code } });
      throw new UnauthorizedException('Authorization code has expired');
    }

    // 4. Validate client ownership
    if (authCode.clientId !== client.id) {
      throw new UnauthorizedException(
        'Authorization code does not belong to this client',
      );
    }

    // 5. Load user
    const user = await this.userModel.findByPk(authCode.userId);
    if (!user) {
      throw new NotFoundException(
        'User linked to authorization code not found',
      );
    }

    // 6. Generate tokens
    const tokenPair = await this.jwtTokenIssuer.issueTokens({
      email: user.email,
      password: user.password,
      userId: user.id,
      role: user.role,
      name: user.name,
      auth_code: code,
      client_id: client.client_id,
      client_secret,
    });

    // Hash client secret for storage
    const saltRoundsEnv =
      this.configService.get<string>('BCRYPT_SALT_ROUNDS') ?? '12';
    const saltRounds = Number.isNaN(Number(saltRoundsEnv))
      ? 12
      : Number(saltRoundsEnv);

    const hashedClientSecret = await hash(client_secret, saltRounds);

    await this.clientAppTokenModel.create({
      userId: user.id,
      clientId: client.client_id,
      hashedClientSecret,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      accessTokenIssuedAt: new Date(),
      refreshTokenIssuedAt: new Date(),
    });

    // 7. Remove used authorization code
    await this.authCodeModel.destroy({ where: { code } });

    return {
      access_token: tokenPair.accessToken,
      refresh_token: tokenPair.refreshToken,
      token_type: 'Bearer',
    };
  }

  // -------------------- LinkedIn Login with OAuth2 Support --------------------

  async linkedinLogin(
    profile: {
      linkedinId: string;
      email: string;
      firstName: string;
      lastName: string;
      picture: string;
    },
    oauthParams?: {
      client_id?: string;
      redirect_uri?: string;
      state?: string;
    },
  ) {
    // Find or create user
    let user = await this.userModel.findOne({
      where: { linkedinId: profile.linkedinId },
    });

    // Update existing user's profile picture
    if (user) {
      await user.update({
        profilePicture: profile.picture,
      });
    }

    // Link LinkedIn to existing email account
    if (!user && profile.email) {
      const userByEmail = await this.userModel.findOne({
        where: { email: profile.email },
      });

      if (userByEmail) {
        await userByEmail.update({
          linkedinId: profile.linkedinId,
          profilePicture: profile.picture,
          isVerified: true,
        });
        user = userByEmail;
      }
    }

    // Create new user if not found
    if (!user) {
      const fullName =
        `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
        'LinkedIn User';
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
    }

    // -------------------- OAuth2 Authorization Code Flow --------------------
    if (oauthParams?.client_id && oauthParams?.redirect_uri) {
      const client = await this.clientModel.findOne({
        where: { client_id: oauthParams.client_id },
      });

      if (!client) {
        throw new BadRequestException(
          'Unauthorized client: This application is not registered.',
        );
      }

      if (client.redirect_uri !== oauthParams.redirect_uri) {
        throw new BadRequestException(
          `Invalid redirect URI: Expected ${client.redirect_uri}, got: ${oauthParams.redirect_uri}`,
        );
      }

      if (client.status !== 'active') {
        throw new BadRequestException('Client application is not active.');
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
      if (oauthParams.state) {
        finalRedirectUri.searchParams.append('state', oauthParams.state);
      }

      return {
        redirect_uri: finalRedirectUri.toString(),
      };
    }

    // -------------------- Direct Login (No OAuth2 Client) --------------------
    const { accessToken, refreshToken } = await this.jwtTokenIssuer.issueTokens(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
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
}
