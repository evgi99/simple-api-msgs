import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { DEFAULT_JWT_SECRET, ACCESS_TOKEN_EXPIRY } from '../common/constants';

function getJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET') || DEFAULT_JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && (secret === DEFAULT_JWT_SECRET || !config.get<string>('JWT_SECRET'))) {
    throw new Error(
      'JWT_SECRET must be set to a secure value in production. Do not use the default.',
    );
  }
  return secret;
}

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: getJwtSecret(config),
        signOptions: {
          expiresIn: (config.get<string>('JWT_ACCESS_EXPIRES_IN') || ACCESS_TOKEN_EXPIRY) as SignOptions['expiresIn'],
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
