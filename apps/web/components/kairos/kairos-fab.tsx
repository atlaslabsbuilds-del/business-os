"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { KairosAvatar } from "./kairos-avatar";

export function KairosFab({ href = "/chat" }: { href?: string }) {
  return (
    <motion.div
      className="fixed bottom-5 left-5 z-30 hidden sm:block"
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 26, delay: 0.4 }}
    >
      <Link
        href={href}
        className="bos-glass-strong group flex items-center gap-3 rounded-full border border-primary/20 py-2 pl-2 pr-4 shadow-elevated transition hover:border-primary/35"
        aria-label="Ask Kairos"
      >
        <KairosAvatar size="sm" interactive state="idle" aria-label="" />
        <span className="text-sm font-semibold text-foreground">Ask Kairos</span>
      </Link>
    </motion.div>
  );
}
