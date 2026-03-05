import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
}

const variantStyles = {
  primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700",
  secondary: "bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700",
  success: "bg-success-500 text-white hover:bg-success-600 active:bg-success-700",
  danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
  ghost: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300",
  outline: "border-2 border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
  xl: "px-8 py-4 text-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "button-press rounded-xl font-semibold transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
