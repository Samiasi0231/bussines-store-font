import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from '../../repositories/user.repository';
import { CacheService } from '../../@common/cache/cache.service';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../token/token.service';
import { ErrorMessage } from '../../@common/constants/message.constant';
import { UserService } from '../../user/user.service';
import { UserProfile } from '../../user/interfaces/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly cacheService: CacheService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      passReqToCallback: true,
    });
  }

  async validate(req: any): Promise<UserProfile> {
    const token = req.get('Authorization').replace('Bearer', '').trim();

    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('jwt.secret'),
    });

    const userId = payload.userId;

    const {
      hashedAccessToken,
      phoneNumber,
      email,
      firstName,
      lastName,
      avatar,
    } = (await this.userService.getCachedUserData(userId)) || {};

    if (!hashedAccessToken) {
      throw new ForbiddenException(ErrorMessage.ACCESS_DENIED);
    }

    const match = await this.tokenService.verifyToken(hashedAccessToken, token);

    if (!match) {
      throw new ForbiddenException(ErrorMessage.ACCESS_DENIED);
    }

    return {
      ...payload,
      phoneNumber,
      email,
      firstName,
      lastName,
      avatar,
      id: userId,
    };
  }
}
