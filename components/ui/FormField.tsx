import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, hint, required, children, className }, ref) => {
    const id = useId();
    return (
      <div ref={ref} className={cn("space-y-1.5", className)}>
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        {children}
        {error && (
          <p className="text-xs text-destructive" id={`${id}-error`}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-muted-foreground" id={`${id}-hint`}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";
