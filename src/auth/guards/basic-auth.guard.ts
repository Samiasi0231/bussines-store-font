import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string | undefined;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException('Basic authentication required');
    }

    const base64Credentials = authHeader.slice('Basic '.length).trim();
    let decoded: string;

    try {
      decoded = Buffer.from(base64Credentials, 'base64').toString('utf8');
    } catch {
      throw new UnauthorizedException('Invalid basic authentication header');
    }

    const [username, password] = decoded.split(':');

    const expectedUsername =
      process.env.DEVICE_BASIC_USERNAME || process.env.BASIC_AUTH_USERNAME || 'device-client';
    const expectedPassword =
      process.env.DEVICE_BASIC_PASSWORD || process.env.BASIC_AUTH_PASSWORD || 'device-secret';

    if (username !== expectedUsername || password !== expectedPassword) {
      throw new UnauthorizedException('Invalid basic authentication credentials');
    }

    return true;
  }
}

