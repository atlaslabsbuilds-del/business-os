"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@repo/ui/button";
import { StartFreeLink } from "./ai-assistant-widget";

const links = [
  { href: "#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "#integrations", label: "Integrations" },
  { href: "#docs", label: "Docs" },
  { href: "#blog", label: "Blog" },
  { href: "#about", label: "About" },
];

export function LandingNavbar({
  onOpenDemo,
  onBookDemo,
}: {
  onOpenDemo: () => void;
  onBookDemo: () => void;
}) {
  const { scrollY } = useScroll();
  const height = useTransform(scrollY, [0, 80], [72, 56]);
  const blur = useTransform(scrollY, [0, 80], [0, 18]);
  const bg = useTransform(scrollY, [0, 80], ["rgba(11,11,15,0)", "rgba(11,11,15,0.72)"]);
  const backdropFilter = useTransform(blur, (value) => `blur(${value}px)`);

  return (
    <motion.header
      style={{ height, backdropFilter, backgroundColor: bg }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/5"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-xs font-bold text-white shadow-soft">
            B
          </span>
          <span className="text-sm font-semibold tracking-tight">Business OS</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-3 py-2 text-sm text-secondary transition hover:bg-elevated/60 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenDemo}
            className="hidden rounded-xl px-3 py-2 text-sm text-secondary transition hover:text-foreground sm:inline-flex"
          >
            Watch Live Demo
          </button>
          <button
            type="button"
            onClick={onBookDemo}
            className="hidden rounded-xl px-3 py-2 text-sm text-secondary transition hover:text-foreground md:inline-flex"
          >
            Book Demo
          </button>
          <Link href="/signin">
            <Button size="sm" variant="ghost">
              Login
            </Button>
          </Link>
          <StartFreeLink>
            <Button size="sm">Start Free</Button>
          </StartFreeLink>
        </div>
      </div>
    </motion.header>
  );
}
