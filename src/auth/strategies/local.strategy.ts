import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { ErrorMessage } from '../../@common/constants/message.constant';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'identifier',
    });
  }

  async validate(identifier: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(identifier, password);

    if (!user) {
      throw new UnauthorizedException(ErrorMessage.INVALID_CREDENTIALS);
    }

    return user;
  }
}
