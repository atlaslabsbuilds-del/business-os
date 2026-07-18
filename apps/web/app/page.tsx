import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";

export default function HomePage() {
  return (
    <div className="bos-atmosphere relative min-h-screen overflow-hidden">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-xs font-bold text-white shadow-soft">
            B
          </span>
          <span className="text-sm font-semibold tracking-tight">Business OS</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/signin">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center px-6 pb-24 pt-16 sm:pt-24">
        <Badge variant="accent" className="mb-6 w-fit">
          AI operating system for modern teams
        </Badge>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Business OS
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-secondary sm:text-lg">
          The enterprise workspace where your company runs on AI — secure auth,
          clean infrastructure, ready to scale.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup">
            <Button size="lg">Create account</Button>
          </Link>
          <Link href="/signin">
            <Button size="lg" variant="secondary">
              Sign in
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
