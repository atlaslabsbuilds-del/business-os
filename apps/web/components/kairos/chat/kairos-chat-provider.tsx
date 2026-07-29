"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type KairosChatContextValue = {
  isOpen: boolean;
  initialPrompt: string | undefined;
  openChat: (prompt?: string) => void;
  closeChat: () => void;
  toggleChat: () => void;
};

const KairosChatContext = createContext<KairosChatContextValue | null>(null);

export function KairosChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>();

  const openChat = useCallback((prompt?: string) => {
    setInitialPrompt(prompt?.trim() || undefined);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setInitialPrompt(undefined);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((current) => {
      if (current) setInitialPrompt(undefined);
      return !current;
    });
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      initialPrompt,
      openChat,
      closeChat,
      toggleChat,
    }),
    [isOpen, initialPrompt, openChat, closeChat, toggleChat],
  );

  return (
    <KairosChatContext.Provider value={value}>{children}</KairosChatContext.Provider>
  );
}

export function useKairosChat() {
  const context = useContext(KairosChatContext);
  if (!context) {
    throw new Error("useKairosChat must be used within KairosChatProvider");
  }
  return context;
}
