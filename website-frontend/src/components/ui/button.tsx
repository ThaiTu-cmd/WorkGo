import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium text-sm select-none cursor-pointer leading-none [&>svg]:shrink-0 " +
  "transition-[transform,box-shadow,filter,background-color,border-color] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] " +
  "active:scale-[0.94] active:brightness-90 active:shadow-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-b from-[#1677FF] to-[#0B4DBB] hover:brightness-110 text-white font-semibold focus-visible:ring-[#1677FF] shadow-md shadow-[#1677FF]/25 hover:shadow-lg hover:shadow-[#1677FF]/35",
        secondary:
          "bg-surface/80 border border-border text-fg hover:bg-muted/80 hover:border-border-strong active:bg-muted focus-visible:ring-primary shadow-xs backdrop-blur-sm",
        outline:
          "border border-border bg-surface/90 backdrop-blur-sm text-fg hover:bg-muted hover:border-border-strong focus-visible:ring-primary shadow-xs",
        ghost:
          "text-fg hover:bg-muted/60 active:bg-muted/80 focus-visible:ring-primary",
        destructive:
          "bg-danger text-white hover:bg-danger-hover active:bg-red-800 focus-visible:ring-danger shadow-xs",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto font-normal focus-visible:ring-primary",
      },
      size: {
        sm: "h-8 px-3.5 text-xs rounded-full min-w-[32px]",
        md: "h-10 px-5 text-sm rounded-full min-w-[40px]",
        lg: "h-12 px-7 text-base rounded-full min-w-[48px]",
        icon: "h-10 w-10 p-0 rounded-full",
        "icon-sm": "h-8 w-8 p-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading ? "true" : undefined}
        {...props}
      >
        {isLoading && <Spinner size="sm" />}
        {isLoading && loadingText ? loadingText : children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
