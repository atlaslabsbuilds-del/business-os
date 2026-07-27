import Image from "next/image";

export function VanderBaseLogo({
  compact = false,
  priority = false,
  className = "",
}: {
  compact?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/branding/vanderbase-logo.png"
        alt="VanderBase"
        width={compact ? 32 : 38}
        height={compact ? 32 : 38}
        priority={priority}
        className="rounded-xl object-cover"
      />
      {!compact ? (
        <span className="text-sm font-semibold uppercase tracking-[0.18em]">
          <span className="text-white">VANDER</span>
          <span className="text-primary">BASE</span>
        </span>
      ) : null}
    </span>
  );
}
