import { HttpStatus } from '@nestjs/common';
import { IResponse } from '../response';

export const handleHttpError = (error): IResponse<any> => {
  const { message, code = HttpStatus.BAD_GATEWAY } = error;

  return {
    success: false,
    status: error?.response?.status || code,
    message:
      error?.response?.data.message || error?.response?.data.error || message,
    data: null,
  };
};
