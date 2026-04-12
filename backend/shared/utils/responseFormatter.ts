/**
 * ResponseFormatter — success / paginated envelopes for API responses.
 * HTTP error bodies (`{ error, fields? }`) are produced by the global error handler and validate middleware, not here.
 */

import type { PaginatedResponse, SuccessResponse } from "../types/response";

class ResponseFormatter {
  /**
   * Formats a successful response with optional data and message.
   */
  static success<T = unknown>(
    data: T | null = null,
    message = "Success",
    statusCode = 200,
  ): SuccessResponse<T> {
    return {
      success: true,
      message,
      data,
      statusCode,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Formats a paginated response with data and pagination details.
   */
  static paginated<T = unknown>(
    data: T | null = null,
    page: number,
    limit: number,
    total: number,
  ): PaginatedResponse<T> {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export default ResponseFormatter;
