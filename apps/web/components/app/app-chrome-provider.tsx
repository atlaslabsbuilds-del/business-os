"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  KairosAction,
  KairosCreateEntity,
  KairosWorkspaceContext,
} from "../../lib/kairos-agent";

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
  /** Optional workflow continuation after create succeeds */
  workflowContinue?: {
    workflowId: string;
    stepIndex: number;
  };
} | null;

export type ConfirmState = {
  action: KairosAction;
} | null;

export type WorkflowRunnerState = {
  workflowId: string;
  stepIndex: number;
  draft: Record<string, string>;
} | null;

type ConfirmResolver = (ok: boolean) => void;

type AppChromeContextValue = {
  workspaceContext: Partial<
    Omit<KairosWorkspaceContext, "pathname" | "module">
  >;
  commandOpen: boolean;
  openCommand: (prefill?: string) => void;
  closeCommand: () => void;
  toggleCommand: () => void;
  commandPrefill: string | null;
  clearCommandPrefill: () => void;
  quickActionsOpen: boolean;
  setQuickActionsOpen: (open: boolean) => void;
  quickCreate: QuickCreateState;
  openQuickCreate: (
    entity: KairosCreateEntity,
    draft?: Record<string, string>,
    workflowContinue?: QuickCreateState extends null
      ? never
      : NonNullable<QuickCreateState>["workflowContinue"],
  ) => void;
  closeQuickCreate: () => void;
  actionStatus: string | null;
  showActionStatus: (message: string, durationMs?: number) => Promise<void>;
  confirmState: ConfirmState;
  requestConfirm: (action: KairosAction) => Promise<boolean>;
  resolveConfirm: (ok: boolean) => void;
  workflowState: WorkflowRunnerState;
  startWorkflow: (workflowId: string, draft?: Record<string, string>) => void;
  advanceWorkflow: () => void;
  cancelWorkflow: () => void;
  setWorkflowStep: (stepIndex: number) => void;
  toasts: AppToast[];
  pushToast: (toast: Omit<AppToast, "id">) => void;
  dismissToast: (id: string) => void;
};

const AppChromeContext = createContext<AppChromeContextValue | null>(null);

export function AppChromeProvider({
  children,
  workspaceContext = {},
}: {
  children: ReactNode;
  workspaceContext?: Partial<
    Omit<KairosWorkspaceContext, "pathname" | "module">
  >;
}) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandPrefill, setCommandPrefill] = useState<string | null>(null);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [quickCreate, setQuickCreate] = useState<QuickCreateState>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowRunnerState>(null);
  const [toasts, setToasts] = useState<AppToast[]>([]);
  const confirmResolver = useRef<ConfirmResolver | null>(null);

  const openCommand = useCallback((prefill?: string) => {
    if (prefill !== undefined) setCommandPrefill(prefill);
    setCommandOpen(true);
  }, []);
  const closeCommand = useCallback(() => {
    setCommandOpen(false);
    setCommandPrefill(null);
  }, []);
  const toggleCommand = useCallback(() => {
    setCommandOpen((value) => {
      if (value) setCommandPrefill(null);
      return !value;
    });
  }, []);
  const clearCommandPrefill = useCallback(() => setCommandPrefill(null), []);

  const openQuickCreate = useCallback(
    (
      entity: KairosCreateEntity,
      draft: Record<string, string> = {},
      workflowContinue?: NonNullable<QuickCreateState>["workflowContinue"],
    ) => {
      setQuickCreate({ entity, draft, workflowContinue });
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

  const requestConfirm = useCallback((action: KairosAction) => {
    setConfirmState({ action });
    return new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve;
    });
  }, []);

  const resolveConfirm = useCallback((ok: boolean) => {
    setConfirmState(null);
    confirmResolver.current?.(ok);
    confirmResolver.current = null;
  }, []);

  const startWorkflow = useCallback(
    (workflowId: string, draft: Record<string, string> = {}) => {
      setWorkflowState({ workflowId, stepIndex: 0, draft });
    },
    [],
  );

  const advanceWorkflow = useCallback(() => {
    setWorkflowState((current) => {
      if (!current) return null;
      return { ...current, stepIndex: current.stepIndex + 1 };
    });
  }, []);

  const cancelWorkflow = useCallback(() => setWorkflowState(null), []);

  const setWorkflowStep = useCallback((stepIndex: number) => {
    setWorkflowState((current) =>
      current ? { ...current, stepIndex } : null,
    );
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
      workspaceContext,
      commandOpen,
      openCommand,
      closeCommand,
      toggleCommand,
      commandPrefill,
      clearCommandPrefill,
      quickActionsOpen,
      setQuickActionsOpen,
      quickCreate,
      openQuickCreate,
      closeQuickCreate,
      actionStatus,
      showActionStatus,
      confirmState,
      requestConfirm,
      resolveConfirm,
      workflowState,
      startWorkflow,
      advanceWorkflow,
      cancelWorkflow,
      setWorkflowStep,
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      commandOpen,
      workspaceContext,
      openCommand,
      closeCommand,
      toggleCommand,
      commandPrefill,
      clearCommandPrefill,
      quickActionsOpen,
      quickCreate,
      openQuickCreate,
      closeQuickCreate,
      actionStatus,
      showActionStatus,
      confirmState,
      requestConfirm,
      resolveConfirm,
      workflowState,
      startWorkflow,
      advanceWorkflow,
      cancelWorkflow,
      setWorkflowStep,
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
