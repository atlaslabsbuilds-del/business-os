import { VanderBaseLogo } from "./vanderbase-logo";
import { cn } from "@repo/ui/utils";

export function BrandLoadingScreen({
  label = "Loading VanderBase",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bos-atmosphere flex min-h-[50vh] w-full flex-col items-center justify-center gap-6 px-6",
        className,
      )}
      role="status"
      aria-busy
      aria-label={label}
    >
      <div className="animate-[vb-breathe_1.6s_ease-in-out_infinite]">
        <VanderBaseLogo size="nav" priority />
      </div>
      <div className="h-1 w-28 overflow-hidden rounded-full bg-elevated">
        <div className="h-full w-1/2 animate-[vb-slide_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
