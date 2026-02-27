import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "dark" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonClassNameOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
};

const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  dark: "btn-dark",
  danger: "btn-danger",
  ghost: "btn-ghost",
};

const BUTTON_SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: ButtonClassNameOptions = {}) {
  return cx("btn", BUTTON_VARIANT_CLASS[variant], BUTTON_SIZE_CLASS[size], fullWidth && "btn-full", className);
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button {...props} className={buttonClassName({ variant, size, fullWidth, className })} type={type}>
      {leftIcon ? <span aria-hidden="true" className="btn-icon-slot">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span aria-hidden="true" className="btn-icon-slot">{rightIcon}</span> : null}
    </button>
  );
}
