export type PromptTemplateValues = Record<string, string | number | boolean | null | undefined>;

export type PromptTemplate = {
  id: string;
  description: string;
  template: string;
};

export const PROMPT_TEMPLATES = {
  summarize: {
    id: "summarize",
    description: "Summarize content for an enterprise operator",
    template:
      "Summarize the following content for {{audience}} in {{style}} style.\n\nContent:\n{{content}}",
  },
  extractJson: {
    id: "extractJson",
    description: "Extract structured fields into JSON",
    template:
      "Extract the requested fields into JSON.\nFields: {{fields}}\n\nSource:\n{{content}}",
  },
  classify: {
    id: "classify",
    description: "Classify text into one of the given labels",
    template:
      "Classify the text into one label from: {{labels}}\nReturn only the label.\n\nText:\n{{content}}",
  },
  rewrite: {
    id: "rewrite",
    description: "Rewrite text with a target tone",
    template: "Rewrite the text in a {{tone}} tone.\n\nText:\n{{content}}",
  },
} as const satisfies Record<string, PromptTemplate>;

export function renderPromptTemplate(
  template: string | PromptTemplate,
  values: PromptTemplateValues,
): string {
  const source = typeof template === "string" ? template : template.template;
  return source.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = values[key];
    return value === null || value === undefined ? "" : String(value);
  });
}

export function getPromptTemplate(
  id: keyof typeof PROMPT_TEMPLATES,
): PromptTemplate {
  return PROMPT_TEMPLATES[id];
}
