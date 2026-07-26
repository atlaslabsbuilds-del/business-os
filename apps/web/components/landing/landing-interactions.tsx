"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  IntegrationDetailPayload,
  ModulePreviewPayload,
  OverlayId,
} from "../../lib/landing-interactions";

type OverlayState =
  | { id: null }
  | { id: "module-preview"; payload: ModulePreviewPayload }
  | { id: "integration-detail"; payload: IntegrationDetailPayload }
  | { id: Exclude<OverlayId, "module-preview" | "integration-detail">; payload?: undefined };

type LandingInteractionsContextValue = {
  overlay: OverlayState;
  isOverlayOpen: boolean;
  assistantMinimized: boolean;
  openOverlay: (id: OverlayId, payload?: ModulePreviewPayload | IntegrationDetailPayload) => void;
  closeOverlay: () => void;
  toggleAssistant: () => void;
  minimizeAssistant: () => void;
  fireStartFreeConfetti: () => void;
  confettiNonce: number;
};

const LandingInteractionsContext = createContext<LandingInteractionsContextValue | null>(null);

const EXIT_INTENT_KEY = "bos-exit-intent-shown";

export function LandingInteractionsProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<OverlayState>({ id: null });
  const [assistantMinimized, setAssistantMinimized] = useState(true);
  const [confettiNonce, setConfettiNonce] = useState(0);
  const exitIntentShown = useRef(false);

  const closeOverlay = useCallback(() => setOverlay({ id: null }), []);

  const openOverlay = useCallback(
    (id: OverlayId, payload?: ModulePreviewPayload | IntegrationDetailPayload) => {
      setAssistantMinimized(true);
      if (id === "module-preview" && payload && "title" in payload) {
        setOverlay({ id: "module-preview", payload: payload as ModulePreviewPayload });
        return;
      }
      if (id === "integration-detail" && payload && "name" in payload) {
        setOverlay({ id: "integration-detail", payload: payload as IntegrationDetailPayload });
        return;
      }
      setOverlay({ id: id as Exclude<OverlayState["id"], null | "module-preview" | "integration-detail"> });
    },
    [],
  );

  const toggleAssistant = useCallback(() => {
    setOverlay({ id: null });
    setAssistantMinimized((value) => !value);
  }, []);

  const minimizeAssistant = useCallback(() => setAssistantMinimized(true), []);

  const fireStartFreeConfetti = useCallback(() => {
    setConfettiNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        openOverlay("command-palette");
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openOverlay("command-palette");
      }
      if (event.key === "Escape") {
        if (!assistantMinimized) {
          setAssistantMinimized(true);
          return;
        }
        closeOverlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assistantMinimized, closeOverlay, openOverlay]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(EXIT_INTENT_KEY)) {
      exitIntentShown.current = true;
    }

    const onMouseLeave = (event: MouseEvent) => {
      if (exitIntentShown.current) return;
      if (event.clientY > 24) return;
      if (overlay.id !== null) return;
      if (!assistantMinimized) return;
      exitIntentShown.current = true;
      sessionStorage.setItem(EXIT_INTENT_KEY, "1");
      openOverlay("exit-intent");
    };

    document.addEventListener("mouseleave", onMouseLeave);
    return () => document.removeEventListener("mouseleave", onMouseLeave);
  }, [assistantMinimized, openOverlay, overlay.id]);

  const value = useMemo(
    () => ({
      overlay,
      isOverlayOpen: overlay.id !== null,
      assistantMinimized,
      openOverlay,
      closeOverlay,
      toggleAssistant,
      minimizeAssistant,
      fireStartFreeConfetti,
      confettiNonce,
    }),
    [
      overlay,
      assistantMinimized,
      openOverlay,
      closeOverlay,
      toggleAssistant,
      minimizeAssistant,
      fireStartFreeConfetti,
      confettiNonce,
    ],
  );

  return (
    <LandingInteractionsContext.Provider value={value}>{children}</LandingInteractionsContext.Provider>
  );
}

export function useLandingInteractions() {
  const context = useContext(LandingInteractionsContext);
  if (!context) {
    throw new Error("useLandingInteractions must be used within LandingInteractionsProvider");
  }
  return context;
}
