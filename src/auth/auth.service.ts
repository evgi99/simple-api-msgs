import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '../common/constants';

export type TokenType = 'access' | 'refresh';

export interface JwtPayload {
  sub: string;
  email: string;
  type: TokenType;
}

export interface AuthResult {
  access_token: string;
  refresh_token: string;
  user: { id: string; email: string };
}

export interface RefreshResult {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string): Promise<AuthResult> {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.create(email, passwordHash);
    return this.buildAuthResult(user._id.toString(), user.email);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.buildAuthResult(user._id.toString(), user.email);
  }

  /**
   * Exchanges a valid refresh token for a new access token and refresh token.
   */
  async refresh(refreshToken: string): Promise<RefreshResult> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return {
      access_token: this.createAccessToken(payload.sub, payload.email),
      refresh_token: this.createRefreshToken(payload.sub, payload.email),
    };
  }

  async validateUser(payload: JwtPayload): Promise<{ id: string; email: string } | null> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) return null;
    return { id: user._id.toString(), email: user.email };
  }

  private buildAuthResult(userId: string, email: string): AuthResult {
    return {
      access_token: this.createAccessToken(userId, email),
      refresh_token: this.createRefreshToken(userId, email),
      user: { id: userId, email },
    };
  }

  private createAccessToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email, type: 'access' as const },
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );
  }

  private createRefreshToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email, type: 'refresh' as const },
      { expiresIn: REFRESH_TOKEN_EXPIRY },
    );
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
