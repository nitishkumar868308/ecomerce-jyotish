"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./loader/Spinner";

const variantStyles = {
  primary:
    "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] focus-visible:ring-[var(--accent-primary)]",
  secondary:
    "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] focus-visible:ring-[var(--border-primary)]",
  outline:
    "border border-[var(--border-primary)] text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-secondary)] focus-visible:ring-[var(--border-focus)]",
  ghost:
    "bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] focus-visible:ring-[var(--border-focus)]",
  danger:
    "bg-[var(--accent-danger)] text-white hover:opacity-90 focus-visible:ring-[var(--accent-danger)]",
} as const;

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-lg",
} as const;

type Variant = keyof typeof variantStyles;
type Size = keyof typeof sizeStyles;

type ButtonBaseProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    as?: "button";
    href?: never;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
    as: "a";
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(props, ref) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    fullWidth,
    leftIcon,
    rightIcon,
    className,
    children,
    ...rest
  } = props;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    className,
  );

  if (props.as === "a") {
    const { as: _as, variant: _v, size: _s, loading: _l, fullWidth: _fw, leftIcon: _li, rightIcon: _ri, ...anchorProps } = props;
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={classes}
        {...anchorProps}
      >
        {leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </a>
    );
  }

  const { as: _as, variant: _v, size: _s, loading: _l, fullWidth: _fw, leftIcon: _li, rightIcon: _ri, ...buttonProps } = props;

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={classes}
      disabled={disabled || loading}
      {...buttonProps}
    >
      {loading && <Spinner size="sm" />}
      {!loading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = "Button";
export default Button;
