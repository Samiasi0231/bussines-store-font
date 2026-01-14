import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Util } from '../../@common/utilities/helpers.utility';
import { ErrorMessage } from '../../@common/constants/message.constant';
import { JwtResponse } from '../interfaces/jwt.interface';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateJWTToken(userId: string): Promise<JwtResponse> {
    const expiresIn = this.configService.get<string | number>('jwt.expiresIn') || '24h';
    const accessToken = await this.jwtService.signAsync(
      { userId },
      {
        secret: this.configService.get('jwt.secret'),
        expiresIn: expiresIn as any,
      },
    );

    const hashedAccessToken = await Util.hash(accessToken);

    return {
      accessToken,
      hashedAccessToken,
    };
  }

  async generateDeviceToken(
    deviceId: string,
  ): Promise<{ accessToken: string }> {
    const expiresIn =
      this.configService.get<string | number>('deviceJwt.expiresIn') ||
      this.configService.get<string | number>('jwt.expiresIn') ||
      '24h';

    const accessToken = await this.jwtService.signAsync(
      { deviceId },
      {
        secret: this.configService.get('jwt.secret'),
        expiresIn: expiresIn as any,
      },
    );

    return { accessToken };
  }

  async verifyToken(userToken: string, token: string): Promise<boolean> {
    if (!userToken) throw new ForbiddenException(ErrorMessage.ACCESS_DENIED);
    return Util.verifyHash(userToken, token);
  }

  /**
   * Converts JWT expiration string (e.g., '24h', '1d', '3600s') to seconds
   * This ensures cache TTL matches JWT expiration time
   */
  getJwtExpirationInSeconds(): number {
    const expiresIn = this.configService.get<string | number>('jwt.expiresIn') || '24h';
    
    // If it's already a number, assume it's in seconds
    if (typeof expiresIn === 'number') {
      return expiresIn;
    }

    // Parse string format (e.g., '24h', '1d', '3600s', '30m')
    const str = String(expiresIn).trim();
    const match = str.match(/^(\d+)([smhd])?$/i);
    
    if (!match) {
      // If no match, default to 24 hours
      return 24 * 60 * 60;
    }

    const value = parseInt(match[1], 10);
    const unit = (match[2] || 's').toLowerCase();

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 24 * 60 * 60; // Default to 24 hours
    }
  }
}
