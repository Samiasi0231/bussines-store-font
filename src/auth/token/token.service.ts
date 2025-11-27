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

  async verifyToken(userToken: string, token: string): Promise<boolean> {
    if (!userToken) throw new ForbiddenException(ErrorMessage.ACCESS_DENIED);
    return Util.verifyHash(userToken, token);
  }
}
