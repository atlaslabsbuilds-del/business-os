"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@repo/ui/button";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function WaitlistShareActions({ referralUrl }: { referralUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const shareText = encodeURIComponent(
    "I just joined the VanderBase waitlist — the AI-native Business OS powered by Kairos. Join me:",
  );
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(referralUrl)}`;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button type="button" size="sm" className="gap-2" onClick={() => void copyLink()}>
        {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
        {copied ? "Copied" : "Copy Referral Link"}
      </Button>
      <a href={linkedInUrl} target="_blank" rel="noopener noreferrer">
        <Button type="button" size="sm" variant="secondary" className="gap-2">
          <LinkedInIcon className="h-3.5 w-3.5" />
          Share on LinkedIn
        </Button>
      </a>
      <a href={xUrl} target="_blank" rel="noopener noreferrer">
        <Button type="button" size="sm" variant="secondary" className="gap-2">
          <XIcon className="h-3.5 w-3.5" />
          Share on X
        </Button>
      </a>
    </div>
  );
}
