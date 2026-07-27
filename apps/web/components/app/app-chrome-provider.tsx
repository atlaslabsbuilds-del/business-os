"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { KairosCreateEntity } from "../../lib/kairos-actions";

export type ToastVariant = "success" | "warning" | "error" | "info";

export type AppToast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

export type QuickCreateState = {
  entity: KairosCreateEntity;
  draft: Record<string, string>;
} | null;

type AppChromeContextValue = {
  commandOpen: boolean;
  openCommand: () => void;
  closeCommand: () => void;
  toggleCommand: () => void;
  quickActionsOpen: boolean;
  setQuickActionsOpen: (open: boolean) => void;
  quickCreate: QuickCreateState;
  openQuickCreate: (entity: KairosCreateEntity, draft?: Record<string, string>) => void;
  closeQuickCreate: () => void;
  actionStatus: string | null;
  showActionStatus: (message: string, durationMs?: number) => Promise<void>;
  toasts: AppToast[];
  pushToast: (toast: Omit<AppToast, "id">) => void;
  dismissToast: (id: string) => void;
};

const AppChromeContext = createContext<AppChromeContextValue | null>(null);

export function AppChromeProvider({ children }: { children: ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [quickCreate, setQuickCreate] = useState<QuickCreateState>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [toasts, setToasts] = useState<AppToast[]>([]);

  const openCommand = useCallback(() => setCommandOpen(true), []);
  const closeCommand = useCallback(() => setCommandOpen(false), []);
  const toggleCommand = useCallback(() => setCommandOpen((value) => !value), []);

  const openQuickCreate = useCallback(
    (entity: KairosCreateEntity, draft: Record<string, string> = {}) => {
      setQuickCreate({ entity, draft });
    },
    [],
  );
  const closeQuickCreate = useCallback(() => setQuickCreate(null), []);

  const showActionStatus = useCallback((message: string, durationMs = 900) => {
    setActionStatus(message);
    return new Promise<void>((resolve) => {
      window.setTimeout(() => {
        setActionStatus(null);
        resolve();
      }, durationMs);
    });
  }, []);

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
      quickCreate,
      openQuickCreate,
      closeQuickCreate,
      actionStatus,
      showActionStatus,
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
      quickCreate,
      openQuickCreate,
      closeQuickCreate,
      actionStatus,
      showActionStatus,
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
