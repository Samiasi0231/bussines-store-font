import { HttpStatus } from '@nestjs/common';

export class ServiceResponse<T> {
  status: number;
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export const successResponse = <T>(
  message: string,
  data?: any,
  status = HttpStatus.OK,
): ServiceResponse<T> => ({
  success: true,
  message,
  data,
  status,
});

export const errorResponse = <T>(
  message: string,
  data?: any,
  status = HttpStatus.BAD_REQUEST,
): ServiceResponse<T> => ({
  success: false,
  error: message,
  message,
  data,
  status,
});
