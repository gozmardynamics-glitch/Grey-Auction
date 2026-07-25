import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FieldValues, UseFormSetError } from 'react-hook-form';

import {
  getErrorMessage,
  getErrorStatus,
  isErrorStatus,
  setFormErrorsFromApi,
} from '../../shared/utils/error_utils';

interface UseApiErrorOptions<T extends FieldValues> {
  error: unknown;
  setError?: UseFormSetError<T>;
  showToast?: boolean;
  onError?: (error: unknown) => void;
}

export const useApiError = <T extends Record<string, unknown>>({
  error,
  setError,
  showToast = true,
  onError,
}: UseApiErrorOptions<T>) => {
  useEffect(() => {
    if (!error) return;

    // Handle validation errors (422)
    if (setError && isErrorStatus(error, 422)) {
      setFormErrorsFromApi(error, setError);
      return;
    }

    // Handle authentication errors (401)
    if (isErrorStatus(error, 401)) {
      // Redirect to login or refresh token
      window.location.href = '/login';
      return;
    }

    // Handle forbidden errors (403)
    if (isErrorStatus(error, 403)) {
      const message = getErrorMessage(error);
      if (showToast) {
        toast.error(
          message || 'You do not have permission to perform this action.'
        );
      }
      return;
    }

    // Handle not found errors (404)
    if (isErrorStatus(error, 404)) {
      if (showToast) {
        toast.error('Resource not found.');
      }
      return;
    }

    // Handle server errors (500+)
    const status = getErrorStatus(error);
    if (status && status >= 500) {
      if (showToast) {
        toast.error('Server error. Please try again later.');
      }
      return;
    }

    // Handle other errors
    const message = getErrorMessage(error);
    if (showToast && message) {
      toast.error(message);
    }

    // Custom error handler
    if (onError) {
      onError(error);
    }
  }, [error, setError, showToast, onError]);
};
