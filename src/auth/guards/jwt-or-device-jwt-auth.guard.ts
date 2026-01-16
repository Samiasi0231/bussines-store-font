import { ExecutionContext, Injectable, type CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../@common/decorators/public.decorator';
import { DeviceJwtAuthGuard } from './device-jwt-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { firstValueFrom, isObservable, type Observable } from 'rxjs';

@Injectable()
export class JwtOrDeviceJwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {
  }

  private async resolveActivateResult(
    result: boolean | Promise<boolean> | Observable<boolean>,
  ): Promise<boolean> {
    if (isObservable(result)) {
      return firstValueFrom(result);
    }
    return await result;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const deviceGuard = new DeviceJwtAuthGuard(this.reflector);
    const jwtGuard = new JwtAuthGuard(this.reflector);

    let firstError: unknown;

    try {
      const ok = await this.resolveActivateResult(deviceGuard.canActivate(context));
      if (ok) return true;
    } catch (err) {
      firstError = err;
    }

    try {
      const ok = await this.resolveActivateResult(jwtGuard.canActivate(context));
      if (ok) return true;
    } catch (err) {
      throw err ?? firstError;
    }

    if (firstError) throw firstError;
    return false;
  }
}

