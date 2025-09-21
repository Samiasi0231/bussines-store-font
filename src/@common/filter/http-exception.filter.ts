import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  async catch(exception: HttpException, host: ArgumentsHost) {
    const i18n = I18nContext.current(host);
    const response = host.switchToHttp().getResponse<any>();
    const status = exception.getStatus();
    const message = getMessage(exception, i18n);

    return response.status(status).json({
      status,
      message,
      success: false,
    });
  }
}

const getMessage = (exception: any, i18n: I18nContext) => {
  let message = exception?.message;
  try {
    if (Array.isArray(exception['errors'])) {
      const [value, args] = getExceptionValueAndOptions(exception);

      message = i18n.t(value, { args: formatArgs(args) });
    } else if (Array.isArray(exception?.response?.message)) {
      message = exception?.response?.message[0];
    }
  } finally {
    return message;
  }
};

const getExceptionValueAndOptions = (exception: {
  [x: string]: { constraints: any }[];
}) => {
  const constraints = exception['errors'][0].constraints;

  const [value, args] = (Object.values(constraints)[0] as string).split('|');

  return [value, args];
};

const formatArgs = (args: string) => {
  if (args) return JSON.parse(args);

  return {};
};
