import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthResult {
  access_token: string;
  user: { id: string; email: string };
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
    const token = this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
    });
    return {
      access_token: token,
      user: { id: user._id.toString(), email: user.email },
    };
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
    const token = this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
    });
    return {
      access_token: token,
      user: { id: user._id.toString(), email: user.email },
    };
  }

  async validateUser(payload: JwtPayload): Promise<{ id: string; email: string } | null> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) return null;
    return { id: user._id.toString(), email: user.email };
  }
}
