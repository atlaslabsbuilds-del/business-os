"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "warning" | "error" | "info";

export type AppToast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type AppChromeContextValue = {
  commandOpen: boolean;
  openCommand: () => void;
  closeCommand: () => void;
  toggleCommand: () => void;
  quickActionsOpen: boolean;
  setQuickActionsOpen: (open: boolean) => void;
  toasts: AppToast[];
  pushToast: (toast: Omit<AppToast, "id">) => void;
  dismissToast: (id: string) => void;
};

const AppChromeContext = createContext<AppChromeContextValue | null>(null);

export function AppChromeProvider({ children }: { children: ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [toasts, setToasts] = useState<AppToast[]>([]);

  const openCommand = useCallback(() => setCommandOpen(true), []);
  const closeCommand = useCallback(() => setCommandOpen(false), []);
  const toggleCommand = useCallback(() => setCommandOpen((value) => !value), []);

  const pushToast = useCallback((toast: Omit<AppToast, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...toast, id }].slice(-4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      commandOpen,
      openCommand,
      closeCommand,
      toggleCommand,
      quickActionsOpen,
      setQuickActionsOpen,
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      commandOpen,
      openCommand,
      closeCommand,
      toggleCommand,
      quickActionsOpen,
      toasts,
      pushToast,
      dismissToast,
    ],
  );

  return <AppChromeContext.Provider value={value}>{children}</AppChromeContext.Provider>;
}

export function useAppChrome() {
  const context = useContext(AppChromeContext);
  if (!context) {
    throw new Error("useAppChrome must be used within AppChromeProvider");
  }
  return context;
}
