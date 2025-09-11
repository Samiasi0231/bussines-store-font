export const ErrorMessage = {
  AN_ERROR_OCCURED: 'Something went wrong. Please try again.',
  GET_ENV: (key: string) => `Missing env key ${key}`,
};

export type ErrorMessage = (typeof ErrorMessage)[keyof typeof ErrorMessage];

export const SuccessMessage = {
  OPERATION_SUCCESSFUL: 'Operation successful',
};

export type SuccessMessage =
  (typeof SuccessMessage)[keyof typeof SuccessMessage];

export type ResponseMessage = ErrorMessage | SuccessMessage;
