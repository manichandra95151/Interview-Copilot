"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "amber";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[#4F46E5] text-white hover:bg-[#4338CA] shadow-sm shadow-indigo-900/10 disabled:bg-[#A7A2E8] disabled:shadow-none",
  secondary:
    "bg-white text-[#1A1A1A] border border-[#E0DBCF] hover:border-[#C9C2B2] hover:bg-[#FBFAF7] shadow-sm",
  ghost: "text-[#6A665E] hover:text-[#1A1A1A] hover:bg-[#F5F3EE]",
  danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-900/10",
  amber: "bg-[#E8A33D] text-white hover:bg-[#C9821B] shadow-sm shadow-amber-900/10",
};

const SIZES: Record<Size, string> = {
  sm: "text-[13px] px-3.5 py-2 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-[15px] px-6 py-3 rounded-xl gap-2 font-semibold",
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
        "inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
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
