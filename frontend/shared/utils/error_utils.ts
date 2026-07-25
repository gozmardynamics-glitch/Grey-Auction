import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import type { UseFormSetError, Path } from 'react-hook-form';

import type { ApiError } from '../../redux/api';

/**
 * Checks if the given error is an instance of ApiError.
 *
 * @param error The error to check.
 * @returns True if the error is an instance of ApiError, false otherwise.
 */
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'data' in error
  );
};

export const isFetchBaseQueryError = (
  error: unknown
): error is FetchBaseQueryError => {
  return typeof error === 'object' && error != null && 'status' in error;
};

export const isSerializedError = (error: unknown): error is SerializedError => {
  return typeof error === 'object' && error != null && 'message' in error;
};

// Extract error message from different error types
export const getErrorMessage = (error: unknown): string => {
  if (isFetchBaseQueryError(error)) {
    if (error.status === 'FETCH_ERROR') {
      return 'Network error. Please check your connection.';
    }
    if (error.status === 'PARSING_ERROR') {
      return 'Error parsing server response.';
    }
    if (error.status === 'TIMEOUT_ERROR') {
      return 'Request timeout. Please try again.';
    }

    if (
      error.data &&
      typeof error.data === 'object' &&
      'message' in error.data
    ) {
      return error.data.message as string;
    }

    return `Error: ${error.status}`;
  }

  if (isSerializedError(error)) {
    return error.message || 'An unexpected error occurred';
  }

  return 'An unexpected error occurred';
};

// Extract validation errors for form fields
export const extractValidationErrors = (
  error: unknown
): Record<string, string> => {
  if (!isFetchBaseQueryError(error)) return {};

  const errorData = error.data as ApiError['data'];

  // Handle API's error format (status 422)
  if (error.status === 422 && errorData?.errors) {
    const validationErrors: Record<string, string> = {};

    Object.entries(errorData.errors)?.forEach(([field, messages]) => {
      if (Array.isArray(messages) && messages.length > 0) {
        validationErrors[field] = messages[0];
      }
    });

    return validationErrors;
  }

  return {};
};

// Set form errors from API response
export const setFormErrorsFromApi = <T extends Record<string, unknown>>(
  error: unknown,
  setError: UseFormSetError<T>
) => {
  const validationErrors = extractValidationErrors(error);

  Object.entries(validationErrors)?.forEach(([field, message]) => {
    setError(field as Path<T>, {
      type: 'server',
      message,
    });
  });
};

// Get HTTP status from error
export const getErrorStatus = (error: unknown): number | null => {
  if (isFetchBaseQueryError(error) && typeof error.status === 'number') {
    return error.status;
  }
  return null;
};

// Check if error is a specific status
export const isErrorStatus = (error: unknown, status: number): boolean => {
  return getErrorStatus(error) === status;
};
