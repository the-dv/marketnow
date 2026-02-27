import type { ButtonHTMLAttributes, ReactNode } from "react";

export type IconButtonVariant = "dark" | "danger" | "ghost";
export type IconButtonSize = "sm" | "md";

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "className" | "aria-label"
> & {
  "aria-label": string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  tooltip?: string;
  className?: string;
};

const ICON_BUTTON_VARIANT_CLASS: Record<IconButtonVariant, string> = {
  dark: "icon-btn-dark",
  danger: "icon-btn-danger",
  ghost: "icon-btn-ghost",
};

const ICON_BUTTON_SIZE_CLASS: Record<IconButtonSize, string> = {
  sm: "icon-btn-sm",
  md: "icon-btn-md",
};

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export function iconButtonClassName({
  variant = "ghost",
  size = "md",
  className,
}: {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  className?: string;
} = {}) {
  return cx("icon-btn", ICON_BUTTON_VARIANT_CLASS[variant], ICON_BUTTON_SIZE_CLASS[size], className);
}

export function IconButton({
  icon,
  tooltip,
  variant = "ghost",
  size = "md",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      className={iconButtonClassName({ variant, size, className })}
      title={tooltip}
      type={type}
    >
      {icon}
    </button>
  );
}
