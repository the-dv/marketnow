"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

type FormSubmitButtonProps = {
  idleText: string;
  pendingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function FormSubmitButton({
  idleText,
  pendingText = "Processando...",
  variant = "primary",
  size = "md",
  className,
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-busy={pending}
      className={className}
      disabled={pending}
      size={size}
      type="submit"
      variant={variant}
    >
      {pending ? pendingText : idleText}
    </Button>
  );
}

