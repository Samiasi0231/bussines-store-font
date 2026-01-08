import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException, HttpException, Logger, HttpStatus } from '@nestjs/common';
import { MulterError } from 'multer';

@Catch(MulterError, BadRequestException)
export class MulterExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MulterExceptionFilter.name);

  catch(exception: MulterError | BadRequestException | HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    let status = HttpStatus.BAD_REQUEST;
    let message = 'An error occurred';
    let error = 'Bad Request';

    if (exception instanceof MulterError) {
      // Map Multer error codes to appropriate HTTP status codes
      switch (exception.code) {
        case 'LIMIT_FILE_SIZE':
          status = HttpStatus.PAYLOAD_TOO_LARGE; // 413
          message = `File size exceeds the maximum allowed size. Maximum size: ${process.env.MAX_UPLOAD_FILE_SIZE ? `${parseInt(process.env.MAX_UPLOAD_FILE_SIZE) / 1024 / 1024}MB` : '50MB'}`;
          error = 'File Too Large';
          break;
        case 'LIMIT_FILE_COUNT':
          status = HttpStatus.BAD_REQUEST;
          message = 'Too many files uploaded';
          error = 'File Count Limit Exceeded';
          break;
        case 'LIMIT_FIELD_KEY':
          status = HttpStatus.BAD_REQUEST;
          message = 'Field name too long';
          error = 'Field Name Too Long';
          break;
        case 'LIMIT_FIELD_VALUE':
          status = HttpStatus.BAD_REQUEST;
          message = 'Field value too long';
          error = 'Field Value Too Long';
          break;
        case 'LIMIT_FIELD_COUNT':
          status = HttpStatus.BAD_REQUEST;
          message = 'Too many fields';
          error = 'Field Count Limit Exceeded';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          status = HttpStatus.BAD_REQUEST;
          message = 'Unexpected file field';
          error = 'Unexpected File Field';
          break;
        default:
          message = exception.message || 'File upload error';
          error = 'Multer Error';
      }

      this.logger.error(
        `Multer error: ${exception.code} - ${message}`,
        {
          code: exception.code,
          message: exception.message,
          field: exception.field,
          reqId: request?.reqId,
          url: request?.url,
          method: request?.method,
        },
      );
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      error = 'Bad Request';
    }

    // Check if headers already sent (might happen if error occurs during upload)
    if (response.headersSent || response.writableEnded) {
      this.logger.warn('Response headers already sent. Cannot send Multer error response.');
      return;
    }

    response.status(status).json({
      status,
      success: false,
      error,
      message,
      reqId: request?.reqId,
    });
  }
}
