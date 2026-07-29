"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@repo/ui/utils";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastVariant = "success" | "error";

type AuthToast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type AuthToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const AuthToastContext = createContext<AuthToastContextValue | null>(null);

export function AuthToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<AuthToast[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, variant }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <AuthToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <AuthToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </AuthToastContext.Provider>
  );
}

function AuthToastItem({
  toast,
  onDismiss,
}: {
  toast: AuthToast;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  const Icon = toast.variant === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-300",
        toast.variant === "success"
          ? "border-emerald-500/30 bg-[#121816]/95 text-emerald-100"
          : "border-red-500/30 bg-[#181214]/95 text-red-100",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p className="flex-1 text-sm leading-relaxed">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md p-0.5 text-current/70 transition hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

export function useAuthToast() {
  const context = useContext(AuthToastContext);
  if (!context) {
    throw new Error("useAuthToast must be used within AuthToastProvider");
  }
  return context;
}
