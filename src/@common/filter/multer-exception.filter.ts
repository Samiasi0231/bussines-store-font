import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException, HttpException } from '@nestjs/common';
import { MulterError } from 'multer';

@Catch(MulterError, BadRequestException)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError | BadRequestException | HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = 400;
    let message = 'An error occurred';

    if (exception instanceof MulterError) {
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }

    response.status(status).json({
      status,
      success: false,
      error: exception instanceof MulterError ? 'Multer Error' : 'Bad Request',
      message,
    });
  }
}
