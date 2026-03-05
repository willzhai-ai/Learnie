import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "gradient";
  hover?: boolean;
}

const variantStyles = {
  default: "bg-white border-2 border-gray-200",
  primary: "bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200",
  secondary: "bg-gradient-to-br from-secondary-50 to-secondary-100 border-2 border-secondary-200",
  success: "bg-gradient-to-br from-success-50 to-success-100 border-2 border-success-200",
  gradient: "bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 border-0",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", hover = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl shadow-lg",
          variantStyles[variant],
          hover && "card-hover cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
