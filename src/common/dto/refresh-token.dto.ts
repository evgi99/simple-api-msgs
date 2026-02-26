import { IsJWT, IsString } from 'class-validator';

/**
 * DTO for refresh token request body.
 */
export class RefreshTokenDto {
  @IsString()
  @IsJWT()
  refresh_token!: string;
}
