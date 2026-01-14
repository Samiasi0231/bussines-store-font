import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const DeviceId = createParamDecorator(
  (data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest();
    const device = request.user as { deviceId?: string } | undefined;
    return device?.deviceId;
  },
);

