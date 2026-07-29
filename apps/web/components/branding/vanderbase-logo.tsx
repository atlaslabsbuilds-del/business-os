import Image from "next/image";
import { cn } from "@repo/ui/utils";

/** Official wordmark aspect ratio (712×83 after trim). */
export const VANDERBASE_WORDMARK_RATIO = 712 / 83;

const WORDMARK_SRC = "/branding/vanderbase-wordmark.png";
const ICON_SRC = "/branding/vanderbase-icon.png";

export type VanderBaseLogoVariant = "wordmark" | "icon";

/**
 * Official VanderBase brand mark.
 * Exact wordmark asset only — never redrawn as text.
 */
export function VanderBaseLogo({
  variant = "wordmark",
  /** @deprecated Prefer variant="icon" */
  compact = false,
  priority = false,
  className = "",
  height,
  size = "nav",
}: {
  variant?: VanderBaseLogoVariant;
  compact?: boolean;
  priority?: boolean;
  className?: string;
  height?: number;
  /** sm ≈28 · md ≈32 · nav ≈35 (navbar) · lg ≈40 */
  size?: "sm" | "md" | "nav" | "lg";
}) {
  const resolvedVariant: VanderBaseLogoVariant =
    compact || variant === "icon" ? "icon" : "wordmark";

  if (resolvedVariant === "icon") {
    const iconSize = height ?? (size === "sm" ? 28 : size === "md" ? 32 : 36);
    return (
      <span className={cn("inline-flex shrink-0 items-center leading-none", className)}>
        <Image
          src={ICON_SRC}
          alt="VanderBase"
          width={iconSize}
          height={iconSize}
          priority={priority}
          className="object-contain"
        />
      </span>
    );
  }

  if (height != null) {
    const width = Math.round(height * VANDERBASE_WORDMARK_RATIO);
    return (
      <span className={cn("inline-flex shrink-0 items-center leading-none", className)}>
        <Image
          src={WORDMARK_SRC}
          alt="VanderBase"
          width={width}
          height={height}
          priority={priority}
          className="object-contain object-left"
          style={{ height, width: "auto" }}
        />
      </span>
    );
  }

  if (size === "nav") {
    // Desktop: up to 35×200. Mobile/tablet: 28–32px tall, 180–190px wide.
    // max-* + object-contain preserve aspect ratio (no stretch/crop).
    return (
      <span
        className={cn(
          "inline-flex h-[28px] max-w-[180px] shrink-0 items-center leading-none",
          "sm:h-[30px] sm:max-w-[190px]",
          "md:h-[32px]",
          "lg:h-[35px] lg:max-w-[200px]",
          className,
        )}
      >
        <Image
          src={WORDMARK_SRC}
          alt="VanderBase"
          width={400}
          height={47}
          priority={priority}
          sizes="(max-width: 640px) 180px, (max-width: 1024px) 190px, 200px"
          className="h-auto max-h-full w-auto max-w-full object-contain object-left"
        />
      </span>
    );
  }

  const presetHeight = size === "sm" ? 28 : size === "md" ? 32 : 40;
  const width = Math.round(presetHeight * VANDERBASE_WORDMARK_RATIO);
  const sizeClass =
    size === "sm"
      ? "h-7 w-auto max-w-[160px]"
      : size === "md"
        ? "h-8 w-auto max-w-[180px]"
        : "h-9 w-auto sm:h-10";

  return (
    <span className={cn("inline-flex shrink-0 items-center leading-none", className)}>
      <Image
        src={WORDMARK_SRC}
        alt="VanderBase"
        width={width}
        height={presetHeight}
        priority={priority}
        sizes="(max-width: 640px) 180px, 280px"
        className={cn("object-contain object-left", sizeClass)}
        style={{ width: "auto", maxWidth: "100%" }}
      />
    </span>
  );
}
