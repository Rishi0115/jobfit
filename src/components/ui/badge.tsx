import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-100 text-primary-800 hover:bg-primary-200",
        secondary:
          "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200",
        destructive:
          "border-transparent bg-error-50 text-error-700 border-error-200",
        outline: "text-gray-700 border-gray-300",
        success:
          "border-transparent bg-success-50 text-success-700 border-success-200",
        warning:
          "border-transparent bg-warning-50 text-warning-700 border-warning-200",
        info:
          "border-transparent bg-info-50 text-info-700 border-info-200",
        purple:
          "border-transparent bg-purple-50 text-purple-700 border-purple-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
