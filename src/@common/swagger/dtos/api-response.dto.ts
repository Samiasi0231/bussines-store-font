import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Request ID for tracking',
    example: 'req_123456789',
  })
  reqId: string;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation successful',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
    required: false,
  })
  data?: T;

  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'HTTP status code',
    example: HttpStatus.OK,
    enum: HttpStatus,
  })
  status: HttpStatus;

  @ApiPropertyOptional({
    description: 'Response code',
    example: 'SUCCESS',
  })
  responseCode?: string;
}

export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of records', example: 100 })
  total: number;

  @ApiProperty({ description: 'Total number of pages', example: 10 })
  totalPages: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  currentPage: number;

  @ApiProperty({ description: 'Next page number', example: 2, nullable: true })
  nextPage: number | null;

  @ApiProperty({
    description: 'Previous page number',
    example: null,
    nullable: true,
  })
  prevPage: number | null;

  @ApiProperty({ description: 'Whether there is a next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrevPage: boolean;
}

export class PaginatedResponseDto<T = any> {
  @ApiProperty({ description: 'Array of results', isArray: true })
  results: T[];

  @ApiProperty({ description: 'Pagination metadata', type: PaginationMetaDto })
  pagination: PaginationMetaDto;
}

