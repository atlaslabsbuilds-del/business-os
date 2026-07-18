import { cn } from "./utils";

export type SpinnerProps = {
  className?: string;
  label?: string;
};

export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)} role="status">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-r-transparent"
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
