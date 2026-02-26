"use client";

import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = {
  idleText: string;
  pendingText?: string;
  className?: string;
};

export function FormSubmitButton({
  idleText,
  pendingText = "Processando...",
  className = "button",
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button aria-busy={pending} className={className} disabled={pending} type="submit">
      {pending ? pendingText : idleText}
    </button>
  );
}

