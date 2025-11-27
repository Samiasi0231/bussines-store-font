import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDto, PaginatedResponseDto } from '../dtos/api-response.dto';

/**
 * Decorator to document API responses with a consistent structure
 * @param dataDto - The DTO class for the response data
 * @param description - Optional description for the response
 * @param status - HTTP status code (default: 200)
 */
export const ApiStandardResponse = <T extends Type<any>>(
  dataDto: T,
  description?: string,
  status: number = 200,
) => {
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, dataDto),
    ApiResponse({
      status,
      description: description || 'Successful response',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              data: {
                $ref: getSchemaPath(dataDto),
              },
            },
          },
        ],
      },
    }),
  );
};

/**
 * Decorator to document paginated API responses
 * @param dataDto - The DTO class for the items in the paginated response
 * @param description - Optional description for the response
 */
export const ApiPaginatedResponse = <T extends Type<any>>(
  dataDto: T,
  description?: string,
) => {
  return applyDecorators(
    ApiExtraModels(PaginatedResponseDto, dataDto),
    ApiResponse({
      status: 200,
      description: description || 'Paginated response',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              data: {
                allOf: [
                  { $ref: getSchemaPath(PaginatedResponseDto) },
                  {
                    properties: {
                      results: {
                        type: 'array',
                        items: { $ref: getSchemaPath(dataDto) },
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    }),
  );
};

/**
 * Decorator to document error responses
 * @param status - HTTP status code
 * @param description - Error description
 */
export const ApiErrorResponse = (
  status: number = 400,
  description?: string,
) => {
  return applyDecorators(
    ApiExtraModels(ApiResponseDto),
    ApiResponse({
      status,
      description: description || 'Error response',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string', example: 'Error message' },
            },
          },
        ],
      },
    }),
  );
};

/**
 * Decorator to document common error responses (400, 401, 403, 404, 500)
 */
export const ApiCommonErrorResponses = () => {
  return applyDecorators(
    ApiErrorResponse(400, 'Bad Request'),
    ApiErrorResponse(401, 'Unauthorized'),
    ApiErrorResponse(403, 'Forbidden'),
    ApiErrorResponse(404, 'Not Found'),
    ApiErrorResponse(500, 'Internal Server Error'),
  );
};

