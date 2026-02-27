"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastKind = "success" | "error";

type ToastInput = {
  kind: ToastKind;
  message: string;
  durationMs?: number;
};

type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
  durationMs: number;
};

type ToastContextValue = {
  pushToast: (toast: ToastInput) => void;
  dismissToast: (toastId: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const DEFAULT_TOAST_DURATION_MS = 3000;

function createToastId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (toastId: string) => void;
}) {
  return (
    <div
      className={`toast toast-${toast.kind}`}
      role={toast.kind === "error" ? "alert" : "status"}
      onAnimationEnd={() => onDismiss(toast.id)}
      style={{ animationDuration: `${toast.durationMs}ms` }}
    >
      <p>{toast.message}</p>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((toastId: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
  }, []);

  const pushToast = useCallback((toast: ToastInput) => {
    const normalizedMessage = toast.message.trim();
    if (!normalizedMessage) {
      return;
    }

    const nextToast: ToastItem = {
      id: createToastId(),
      kind: toast.kind,
      message: normalizedMessage,
      durationMs: toast.durationMs ?? DEFAULT_TOAST_DURATION_MS,
    };

    setToasts((currentToasts) => [...currentToasts, nextToast]);
  }, []);

  const contextValue = useMemo(
    () => ({
      pushToast,
      dismissToast,
    }),
    [dismissToast, pushToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <aside aria-atomic="false" aria-live="polite" className="toast-viewport">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} onDismiss={dismissToast} toast={toast} />
        ))}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
