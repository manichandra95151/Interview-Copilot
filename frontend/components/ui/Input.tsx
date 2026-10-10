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
          <label htmlFor={inputId} className="block text-[13px] font-medium text-[#6A665E] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm text-[#1A1A1A] placeholder:text-[#9C978C] transition-all",
            "focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/25 focus:border-[#4F46E5]",
            error ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-[#E0DBCF]",
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
