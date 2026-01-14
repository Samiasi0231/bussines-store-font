import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ErrorMessage } from '../../@common/constants/message.constant';

export interface DeviceJwtPayload {
  deviceId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class DeviceJwtStrategy extends PassportStrategy(Strategy, 'device-jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: DeviceJwtPayload): Promise<{ deviceId: string }> {
    if (!payload?.deviceId) {
      throw new ForbiddenException(ErrorMessage.ACCESS_DENIED);
    }

    const headerDeviceId =
      (req.headers['device-id'] as string | undefined) ||
      (req.headers['device_id'] as string | undefined);

    if (headerDeviceId && headerDeviceId !== payload.deviceId) {
      throw new ForbiddenException(ErrorMessage.ACCESS_DENIED);
    }

    return { deviceId: payload.deviceId };
  }
}

