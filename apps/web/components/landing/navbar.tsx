"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@repo/ui/button";
import { JoinWaitlistButton } from "./ai-assistant-widget";
import { VanderBaseLogo } from "../branding/vanderbase-logo";

const links = [
  { href: "#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/credits", label: "AI Credits" },
  { href: "#integrations", label: "Integrations" },
  { href: "/contact", label: "Contact" },
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
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <motion.header
      style={{ height, backdropFilter, backgroundColor: bg }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/5"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-6 px-5 sm:gap-8 sm:px-8">
        <Link
          href="/"
          className="inline-flex h-full shrink-0 items-center"
          onClick={closeMenu}
          aria-label="VanderBase"
        >
          <VanderBaseLogo size="nav" priority />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-3 py-2 text-sm text-secondary transition hover:bg-elevated/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
          <Link href="/signin" className="hidden sm:inline-flex">
            <Button size="sm" variant="ghost">
              Login
            </Button>
          </Link>
          <JoinWaitlistButton className="hidden sm:inline-flex">
            <Button size="sm">Join the Waitlist</Button>
          </JoinWaitlistButton>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-secondary transition hover:text-foreground lg:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-white/5 bg-[#0B0B0F]/95 px-5 py-4 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 text-sm text-secondary transition hover:bg-white/5 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onBookDemo();
              }}
              className="rounded-xl px-3 py-3 text-left text-sm text-secondary transition hover:bg-white/5 hover:text-foreground"
            >
              Book Demo
            </button>
            <Link href="/signin" onClick={closeMenu} className="mt-2">
              <Button size="sm" variant="secondary" className="w-full">
                Login
              </Button>
            </Link>
            <JoinWaitlistButton className="mt-2 w-full" onClick={closeMenu}>
              <Button size="sm" className="w-full">
                Join the Waitlist
              </Button>
            </JoinWaitlistButton>
          </nav>
        </div>
      ) : null}
    </motion.header>
  );
}
