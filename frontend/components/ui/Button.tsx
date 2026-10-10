"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[#6C47FF] text-white hover:bg-[#5A3AE0] shadow-lg shadow-purple-200/50 disabled:bg-[#B9A8FF] disabled:shadow-none",
  secondary:
    "bg-white text-gray-700 border border-[#E8E4FF] hover:bg-gray-50 hover:border-[#D5CCFF] shadow-sm",
  ghost: "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
  danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200/50",
};

const SIZES: Record<Size, string> = {
  sm: "text-[13px] px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-[15px] px-6 py-3.5 rounded-2xl gap-2 font-bold",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
