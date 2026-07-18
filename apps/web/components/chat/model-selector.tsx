"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Button } from "@repo/ui/button";
import type { ChatModelOption } from "@repo/ai";
import type { AiProviderId } from "@repo/ai";

type ModelSelectorProps = {
  models: ChatModelOption[];
  model: string;
  provider: AiProviderId;
  onChange: (model: string, provider: AiProviderId) => void;
  disabled?: boolean;
};

const providerLabels: Record<AiProviderId, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Gemini",
  groq: "Groq",
};

export function ModelSelector({
  models,
  model,
  provider,
  onChange,
  disabled,
}: ModelSelectorProps) {
  const grouped = models.reduce<Record<AiProviderId, ChatModelOption[]>>(
    (acc, item) => {
      acc[item.provider].push(item);
      return acc;
    },
    { openai: [], anthropic: [], gemini: [], groq: [] },
  );

  const active = models.find(
    (item) => item.model === model && item.provider === provider,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" disabled={disabled}>
          {active?.label ?? `${providerLabels[provider]} · ${model}`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {(Object.keys(grouped) as AiProviderId[]).map((providerId) => {
          const items = grouped[providerId];
          if (items.length === 0) return null;
          return (
            <div key={providerId}>
              <DropdownMenuLabel>{providerLabels[providerId]}</DropdownMenuLabel>
              {items.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => onChange(item.model, item.provider)}
                  className={item.model === model && item.provider === provider ? "bg-accent-muted" : ""}
                >
                  {item.model}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
