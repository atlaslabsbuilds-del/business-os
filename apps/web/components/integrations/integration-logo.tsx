const ACCENTS: Record<string, string> = {
  gmail: "from-red-500/30 to-orange-500/20",
  "google-drive": "from-emerald-500/30 to-sky-500/20",
  "google-calendar": "from-blue-500/30 to-indigo-500/20",
  "google-docs": "from-sky-500/30 to-blue-500/20",
  outlook: "from-sky-500/30 to-blue-600/20",
  onedrive: "from-blue-500/30 to-cyan-500/20",
  slack: "from-fuchsia-500/30 to-purple-500/20",
  discord: "from-indigo-500/30 to-violet-500/20",
  zoom: "from-sky-500/30 to-blue-500/20",
  notion: "from-zinc-400/30 to-zinc-600/20",
  trello: "from-blue-500/30 to-cyan-500/20",
  clickup: "from-purple-500/30 to-pink-500/20",
  asana: "from-rose-500/30 to-orange-500/20",
  github: "from-zinc-300/30 to-zinc-500/20",
  gitlab: "from-orange-500/30 to-red-500/20",
  stripe: "from-violet-500/30 to-indigo-500/20",
  paypal: "from-sky-500/30 to-blue-600/20",
  dropbox: "from-blue-500/30 to-sky-500/20",
};

export function IntegrationProviderLogo({
  provider,
  name,
}: {
  provider: string;
  name: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const accent = ACCENTS[provider] ?? "from-primary/30 to-orange-500/20";

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-sm font-semibold text-foreground shadow-soft ring-1 ring-white/10`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
