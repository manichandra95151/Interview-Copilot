"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm text-gray-900 placeholder:text-gray-400 transition-all",
            "focus:outline-none focus:ring-2 focus:ring-[#6C47FF]/30 focus:border-[#6C47FF]",
            error ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-[#E8E4FF]",
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error ? (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        ) : hint ? (
          <p className="text-xs text-gray-400 mt-1">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
