'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useSacValidation } from '@/lib/hooks/use-sac-validation';
import { cn } from '@/lib/utils';

interface SacInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  showValidation?: boolean;
  onValidationChange?: (isValid: boolean | null) => void;
}

export function SacInput({
  value,
  onChange,
  label = 'SAC Code',
  placeholder = 'e.g., 998314',
  required = false,
  className,
  showValidation = true,
  onValidationChange,
}: SacInputProps) {
  const { validate, clearValidation, isValid, errors, warnings, isValidating } = useSacValidation();
  const [hasBlurred, setHasBlurred] = useState(false);

  // Debounce validation
  useEffect(() => {
    if (!value || value.trim().length === 0) {
      clearValidation();
      onValidationChange?.(null);
      return;
    }

    // Only validate if user has interacted with the field
    if (!hasBlurred && !showValidation) {
      return;
    }

    const timer = setTimeout(() => {
      validate(value);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [value, hasBlurred, validate, clearValidation, showValidation]);

  // Notify parent of validation status
  useEffect(() => {
    onValidationChange?.(isValid ?? null);
  }, [isValid, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const newValue = e.target.value.replace(/\D/g, '');
    onChange(newValue);
  };

  const handleBlur = () => {
    setHasBlurred(true);
    if (value && value.trim().length > 0) {
      validate(value);
    }
  };

  const displayErrors = hasBlurred || showValidation;
  const hasError = displayErrors && errors.length > 0;
  const hasWarning = displayErrors && warnings.length > 0;
  const isValidState = displayErrors && isValid === true;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="sac_code" className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}>
          {label}
        </Label>
      )}
      <div className="relative">
        <Input
          id="sac_code"
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={6}
          className={cn(
            'pl-10 pr-10',
            hasError && 'border-red-500 focus-visible:ring-red-500',
            isValidState && 'border-green-500 focus-visible:ring-green-500',
            hasWarning && !hasError && 'border-yellow-500 focus-visible:ring-yellow-500'
          )}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          #
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isValidating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {!isValidating && displayErrors && (
            <>
              {hasError && <AlertCircle className="h-4 w-4 text-red-500" />}
              {isValidState && !hasError && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {hasWarning && !hasError && !isValidState && (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
            </>
          )}
        </div>
      </div>
      {displayErrors && (
        <>
          {errors.map((error, index) => (
            <p key={index} className="text-xs text-red-500">
              {error.message}
            </p>
          ))}
          {warnings.map((warning, index) => (
            <p key={index} className="text-xs text-yellow-600">
              {warning.message}
            </p>
          ))}
        </>
      )}
      {displayErrors && isValidState && !hasWarning && (
        <p className="text-xs text-green-600">Valid SAC code</p>
      )}
    </div>
  );
}

