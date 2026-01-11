import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { gstApi } from '@/lib/api-client';
import type { SacValidationResponse, ValidateSacRequest } from '@/lib/types/gst';

/**
 * Hook for SAC code validation
 */
export function useSacValidation() {
  const [validationResult, setValidationResult] = useState<SacValidationResponse | null>(null);

  const validateMutation = useMutation({
    mutationFn: async (sacCode: string): Promise<SacValidationResponse> => {
      if (!sacCode || sacCode.trim().length === 0) {
        return {
          isValid: false,
          code: '',
          errors: [{ message: 'SAC code is required', field: 'sac_code' }],
          warnings: [],
        };
      }

      const request: ValidateSacRequest = { sac_code: sacCode.trim() };
      const response = await gstApi.post<SacValidationResponse>('/gst/validate/sac', request);
      return response.data;
    },
    onSuccess: (data) => {
      setValidationResult(data);
    },
    onError: (error: any) => {
      // On error, set basic validation
      const sacCode = (error.config?.data && JSON.parse(error.config.data)?.sac_code) || '';
      setValidationResult({
        isValid: false,
        code: sacCode,
        errors: [{ message: error.response?.data?.message || 'Validation failed', field: 'sac_code' }],
        warnings: [],
      });
    },
  });

  const validate = useCallback(
    (sacCode: string) => {
      // Basic client-side validation first
      if (!sacCode || sacCode.trim().length === 0) {
        setValidationResult({
          isValid: false,
          code: '',
          errors: [{ message: 'SAC code is required', field: 'sac_code' }],
          warnings: [],
        });
        return;
      }

      const trimmed = sacCode.trim();
      if (!/^\d+$/.test(trimmed)) {
        setValidationResult({
          isValid: false,
          code: trimmed,
          errors: [{ message: 'SAC code must contain only digits', field: 'sac_code' }],
          warnings: [],
        });
        return;
      }

      if (trimmed.length !== 6) {
        setValidationResult({
          isValid: false,
          code: trimmed,
          errors: [
            {
              message: `SAC code must be exactly 6 digits. Found ${trimmed.length} digits`,
              field: 'sac_code',
            },
          ],
          warnings: [],
        });
        return;
      }

      // If basic validation passes, call API for detailed validation
      validateMutation.mutate(trimmed);
    },
    [validateMutation]
  );

  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  return {
    validate,
    clearValidation,
    validationResult,
    isValidating: validateMutation.isPending,
    isValid: validationResult?.isValid ?? null,
    errors: validationResult?.errors ?? [],
    warnings: validationResult?.warnings ?? [],
  };
}

