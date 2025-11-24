import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

/**
 * Decorator to add JWT Bearer authentication to an endpoint
 */
export const ApiJwtAuth = () => {
  return applyDecorators(ApiBearerAuth('JWT-auth'));
};

/**
 * Decorator to add API Key authentication to an endpoint
 */
export const ApiKeyAuth = () => {
  return applyDecorators(ApiSecurity('api-key'));
};

/**
 * Decorator to mark an endpoint as public (no authentication required)
 * Note: This should be used with the @Public() decorator from your auth module
 */
export const ApiPublic = () => {
  return applyDecorators();
};

