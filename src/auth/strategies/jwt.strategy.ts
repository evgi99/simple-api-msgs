import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '../auth.service';
import { DEFAULT_JWT_SECRET } from '../../common/constants';

function getJwtSecretOrKey(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET') || DEFAULT_JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && (secret === DEFAULT_JWT_SECRET || !configService.get<string>('JWT_SECRET'))) {
    throw new Error(
      'JWT_SECRET must be set to a secure value in production. Do not use the default.',
    );
  }
  return secret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecretOrKey(configService),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUser(payload);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
