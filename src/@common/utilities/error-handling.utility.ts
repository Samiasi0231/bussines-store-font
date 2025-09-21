import { HttpStatus } from '@nestjs/common';
import { IResponse } from '../response';

export const handleHttpError = (error): IResponse<any> => {
  const { message, code = HttpStatus.BAD_GATEWAY } = error;
  return {
    success: false,
    status: code,
    message,
    data: null,
  };
};
