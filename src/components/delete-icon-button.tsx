"use client";

import { Trash2 } from "lucide-react";

type DeleteIconButtonProps = {
  label: string;
  title?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

export function DeleteIconButton({
  label,
  title = "Excluir",
  disabled = false,
  onClick,
  className = "",
}: DeleteIconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`icon-button icon-button-danger ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      <Trash2 size={16} />
    </button>
  );
}
