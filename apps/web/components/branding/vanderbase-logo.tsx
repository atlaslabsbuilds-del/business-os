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
  /** sm ≈28–32 · md ≈36–40 · nav ≈42 · lg ≈48 */
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

  const presetHeight =
    height ??
    (size === "sm" ? 28 : size === "md" ? 36 : size === "lg" ? 48 : 42);
  const width = Math.round(presetHeight * VANDERBASE_WORDMARK_RATIO);

  const sizeClass =
    height != null
      ? undefined
      : size === "sm"
        ? "h-7 sm:h-8"
        : size === "md"
          ? "h-9 sm:h-10"
          : size === "lg"
            ? "h-10 sm:h-12"
            : "h-7 sm:h-9 md:h-10 lg:h-[42px]";

  return (
    <span className={cn("inline-flex shrink-0 items-center leading-none", className)}>
      <Image
        src={WORDMARK_SRC}
        alt="VanderBase"
        width={width}
        height={presetHeight}
        priority={priority}
        sizes="(max-width: 640px) 240px, (max-width: 1024px) 320px, 380px"
        className={cn("h-auto w-auto max-w-full object-contain object-left", sizeClass)}
        style={height != null ? { height, width: "auto" } : { width: "auto" }}
      />
    </span>
  );
}
