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
  // Temporary in-memory auth code store until auth_codes table is implemented
  private authCodes: {
    code: string;
    userId: number;
    clientId: string;
    expiresAt: Date;
    used: boolean;
    isEnvBacked?: boolean;
  }[] = [];

  private envAuthConfig:
    | {
        code: string;
        clientId: string;
        clientSecret: string;
        userId: number;
        ttlMinutes: number;
      }
    | undefined;

  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(RefreshToken)
    private readonly refreshTokenModel: typeof RefreshToken,
    @InjectModel(Client) private readonly clientModel: typeof Client,
    @InjectModel(AuthorizationCode) private readonly authCodeModel: typeof AuthorizationCode,
    private readonly configService: ConfigService,
    private emailService: EmailService,
  ) {
    this.initializeEnvAuthCode();
  }

  private initializeEnvAuthCode() {
    const code = this.configService.get<string>('DUMMY_AUTH_CODE');
    const clientId = this.configService.get<string>('DUMMY_AUTH_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'DUMMY_AUTH_CLIENT_SECRET',
    );
    const userIdRaw = this.configService.get<string>('DUMMY_AUTH_USER_ID');
    const ttlRaw = this.configService.get<string>(
      'DUMMY_AUTH_CODE_TTL_MINUTES',
    );

    const userId = userIdRaw ? Number(userIdRaw) : undefined;
    const ttlMinutes = ttlRaw ? Number(ttlRaw) : 10;

    if (
      !code ||
      !clientId ||
      !clientSecret ||
      userId === undefined ||
      Number.isNaN(userId)
    ) {
      return;
    }

    this.envAuthConfig = {
      code,
      clientId,
      clientSecret,
      userId,
      ttlMinutes: Number.isNaN(ttlMinutes) ? 10 : ttlMinutes,
    };

    this.authCodes.push({
      code,
      clientId,
      userId,
      expiresAt: new Date(
        Date.now() + this.envAuthConfig.ttlMinutes * 60 * 1000,
      ),
      used: false,
      isEnvBacked: true,
    });
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
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
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

    const { accessToken, refreshToken } = await this.issueTokens(user.id, user.role);
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
    throw new ForbiddenException('Please verify your email before logging in.');
  }
  const isPasswordValid = await compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  if (client_id && redirect_uri) {
    console.log(`[AuthService] Detected OAuth2 Authorization Code flow for client: ${client_id}`);
    
    const client = await this.clientModel.findOne({ where: { client_id } });
    if (!client) {
      throw new BadRequestException('Unauthorized client: This application is not registered.');
    }
    if (client.redirect_uri !== redirect_uri) {
      throw new BadRequestException('Invalid redirect URI: The provided redirect URI does not match the one registered for this client.');
    }

    const code = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.authCodeModel.create({
      code,
      expiresAt,
      userId: user.id,
      clientId: client.id,
      // You might also want to store the original redirect_uri here for later validation
    });
    
    const iaaFrontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    
    // Construct the URL to our own frontend messenger page
    const finalRedirectUri = new URL(`${iaaFrontendUrl}/auth/callback`);
    finalRedirectUri.searchParams.append('code', code);
    if (state) {
      finalRedirectUri.searchParams.append('state', state);
    }
    
    // The key change is here: we return the URL to our OWN callback page.
    return {
      redirect_uri: finalRedirectUri.toString(),
    };
  }
  
  else {
    console.log(`[AuthService] Detected Direct Login (Password Grant) flow for user: ${email}`);
    return this.issueTokens(user.id, user.role);
  }
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
    await this.emailService.sendVerificationEmail(user.name || 'User', user.email, verifyUrl, otp);

    return { message: 'Verification link sent to your email.' };
  }

  // -------------------- Verify Email --------------------
  async verifyEmail(token: string) {
    const user = await this.userModel.findOne({ where: { verificationToken: token } });
    if (!user) throw new NotFoundException('Invalid verification token.');

    await this.userModel.update({ isVerified: true, verificationToken: null }, { where: { id: user.id } });

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

    if (!matched) throw new UnauthorizedException('Invalid or expired refresh token.');

    const user = await this.userModel.findByPk(matched.userId);
    if (!user) throw new NotFoundException('User not found for this token.');

    await this.refreshTokenModel.destroy({ where: { id: matched.id } });

    return this.issueTokens(user.id, user.role);
  }

  // -------------------- Auth Code Token Exchange --------------------
  async exchangeAuthCode(code: string, credentials: ClientCredentialsDto) {
    const { client_id, client_secret } = credentials;

    // 1. Validate client credentials
    const client = await this.clientModel.findOne({
      where: { client_id },
    });

    let clientIdentifier: string | null = null;

    if (client) {
      const isClientSecretValid = await compare(
        client_secret,
        client.client_secret,
      );
      if (!isClientSecretValid) {
        throw new UnauthorizedException('Invalid client credentials');
      }
      clientIdentifier = client.client_id;
    } else if (
      this.envAuthConfig &&
      this.envAuthConfig.clientId === client_id &&
      this.envAuthConfig.clientSecret === client_secret
    ) {
      clientIdentifier = this.envAuthConfig.clientId;
    } else {
      throw new UnauthorizedException('Invalid client credentials');
    }

    // 2. Validate authorization code (dummy in-memory implementation)
    const authCode = this.authCodes.find((c) => c.code === code);
    if (!authCode) {
      throw new UnauthorizedException('Invalid authorization code');
    }

    if (authCode.used) {
      throw new UnauthorizedException('Authorization code already used');
    }

    if (!clientIdentifier) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    if (clientIdentifier !== authCode.clientId) {
      throw new UnauthorizedException(
        'Authorization code does not belong to this client',
      );
    }

    if (authCode.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Authorization code has expired');
    }

    // 3. Retrieve linked user
    const user = await this.userModel.findByPk(authCode.userId);
    if (!user) {
      throw new NotFoundException('User linked to authorization code not found');
    }

    // 4. Generate access and refresh tokens
    const { accessToken, refreshToken, expiresIn } =
      await this.issueClientTokens(user, clientIdentifier);

    // 5. Mark auth code as used
    authCode.used = true;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      token_type: 'Bearer',
    };
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
      const ttl = Number(this.configService.get('REFRESH_TOKEN_TTL_DAYS') ?? 30);
      const expiresAt = new Date(now);
      expiresAt.setDate(now.getDate() + ttl);

      await this.refreshTokenModel.create({ hashedToken: hashedRefresh, userId, expiresAt });

      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Token Generation Error:', error);
      throw new InternalServerErrorException('Could not generate tokens');
    }
  }

  private async issueClientTokens(user: User, clientId: string) {
    try {
      const { SignJWT, importPKCS8 } = await import('jose');
      const privateKeyPem = process.env.JWT_PRIVATE_KEY!.replace(/\\n/g, '\n');
      const privateKey = await importPKCS8(privateKeyPem, 'RS256');
      const keyId = process.env.JWT_KEY_ID!;

      const expiresInSeconds = 3600; // 1 hour

      const accessToken = await new SignJWT({
        sub: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        client_id: clientId,
      })
        .setProtectedHeader({ alg: 'RS256', kid: keyId })
        .setIssuer('https://auth.ist.africa')
        .setAudience(clientId)
        .setSubject(user.id.toString())
        .setIssuedAt()
        .setExpirationTime(`${expiresInSeconds}s`)
        .sign(privateKey);

      const refreshToken = randomUUID();
      const hashedRefresh = await hash(refreshToken, 12);
      const now = new Date();
      const ttl =
        Number(this.configService.get('REFRESH_TOKEN_TTL_DAYS') ?? 30);
      const expiresAt = new Date(now);
      expiresAt.setDate(now.getDate() + ttl);

      await this.refreshTokenModel.create({
        hashedToken: hashedRefresh,
        userId: user.id,
        expiresAt,
      });

      return { accessToken, refreshToken, expiresIn: expiresInSeconds };
    } catch (error) {
      console.error('Token Generation Error:', error);
      throw new InternalServerErrorException('Could not generate tokens');
    }
  }
}
