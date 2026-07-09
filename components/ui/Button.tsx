"use client";

// Duolingo-Stil-Button (Spec §3): satte Fläche, dunklere Unterkante (border-b-4),
// Press-Animation beim Antippen. Auslösen NUR über onClick (Tap-only-Regel).
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "success" | "warning";
export type ButtonSize = "md" | "lg";

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white border-primary-dark",
  secondary: "bg-white text-primary-dark border-2 border-primary",
  success: "bg-success text-white border-success-dark",
  warning: "bg-warning text-white border-warning-dark",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-6 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  full = false,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-b-4 font-bold transition-transform select-none",
        "active:translate-y-1 active:border-b-0",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        full && "w-full",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
