import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { gstApi } from '@/lib/api-client';
import type { HsnValidationResponse, ValidateHsnRequest } from '@/lib/types/gst';

/**
 * Hook for HSN code validation
 */
export function useHsnValidation() {
  const [validationResult, setValidationResult] = useState<HsnValidationResponse | null>(null);

  const validateMutation = useMutation({
    mutationFn: async (hsnCode: string): Promise<HsnValidationResponse> => {
      if (!hsnCode || hsnCode.trim().length === 0) {
        return {
          isValid: false,
          code: '',
          errors: [{ message: 'HSN code is required', field: 'hsn_code' }],
          warnings: [],
        };
      }

      const request: ValidateHsnRequest = { hsn_code: hsnCode.trim() };
      const response = await gstApi.post<HsnValidationResponse>('/gst/validate/hsn', request);
      return response.data;
    },
    onSuccess: (data) => {
      setValidationResult(data);
    },
    onError: (error: any) => {
      // On error, set basic validation
      const hsnCode = (error.config?.data && JSON.parse(error.config.data)?.hsn_code) || '';
      setValidationResult({
        isValid: false,
        code: hsnCode,
        errors: [{ message: error.response?.data?.message || 'Validation failed', field: 'hsn_code' }],
        warnings: [],
      });
    },
  });

  const validate = useCallback(
    (hsnCode: string) => {
      // Basic client-side validation first
      if (!hsnCode || hsnCode.trim().length === 0) {
        setValidationResult({
          isValid: false,
          code: '',
          errors: [{ message: 'HSN code is required', field: 'hsn_code' }],
          warnings: [],
        });
        return;
      }

      const trimmed = hsnCode.trim();
      if (!/^\d+$/.test(trimmed)) {
        setValidationResult({
          isValid: false,
          code: trimmed,
          errors: [{ message: 'HSN code must contain only digits', field: 'hsn_code' }],
          warnings: [],
        });
        return;
      }

      if (trimmed.length !== 4 && trimmed.length !== 6 && trimmed.length !== 8) {
        setValidationResult({
          isValid: false,
          code: trimmed,
          errors: [
            {
              message: `HSN code must be 4, 6, or 8 digits. Found ${trimmed.length} digits`,
              field: 'hsn_code',
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

