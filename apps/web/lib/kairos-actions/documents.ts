import "server-only";

import { z } from "zod";
import {
  answerFromKnowledgeBase,
  createDocument,
  createKnowledgeArticle,
  listDocuments,
  updateDocument,
} from "@repo/database";
import type { KairosToolDefinition } from "./types";

function transformText(
  content: string,
  mode: "rewrite" | "summarize" | "translate" | "grammar" | "sop" | "meeting" | "proposal" | "contract",
  language?: string,
) {
  switch (mode) {
    case "summarize":
      return content
        .split(/\n+/)
        .filter(Boolean)
        .slice(0, 6)
        .map((line) => `- ${line.trim().slice(0, 140)}`)
        .join("\n");
    case "translate":
      return `[${language || "es"} draft]\n\n${content}`;
    case "grammar":
      return content
        .replace(/\bi\b/g, "I")
        .replace(/\s{2,}/g, " ")
        .replace(/\s+([,.!?])/g, "$1")
        .trim();
    case "rewrite":
      return content
        .split(/\n+/)
        .filter(Boolean)
        .map((line) => line.trim())
        .join("\n\n");
    case "sop":
      return `# Standard Operating Procedure\n\n## Purpose\n${content.slice(0, 240)}\n\n## Steps\n1. Prepare inputs\n2. Execute the workflow\n3. Validate outcomes\n4. Log completion\n`;
    case "meeting":
      return `# Meeting Notes\n\n## Summary\n${content.slice(0, 280)}\n\n## Decisions\n- TBD\n\n## Action items\n- [ ] Follow up\n`;
    case "proposal":
      return `# Proposal\n\n## Overview\n${content.slice(0, 280)}\n\n## Scope\n- Deliverables\n- Timeline\n- Investment\n`;
    case "contract":
      return `# Agreement Draft\n\n## Parties\nClient and Provider\n\n## Terms\n${content.slice(0, 280)}\n\n## Signatures\n________________\n`;
    default:
      return content;
  }
}

export function buildKairosDocumentsTools(): KairosToolDefinition[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Array<KairosToolDefinition<any, any>> = [
    {
      name: "writeDocument",
      description: "Create a new workspace document",
      requiredRole: "Sales",
      schema: z.object({
        title: z.string().trim().min(1).max(200),
        content: z.string().max(100_000).optional(),
        isTemplate: z.boolean().optional(),
      }),
      execute: async (ctx, input) => {
        const document = await createDocument({
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          title: input.title,
          content: input.content ?? "",
          isTemplate: input.isTemplate,
        });
        return { document };
      },
    },
    {
      name: "rewriteDocumentContent",
      description: "Rewrite, summarize, translate, or fix grammar for a document",
      requiredRole: "Sales",
      schema: z.object({
        documentId: z.string().uuid().optional(),
        titleQuery: z.string().trim().max(200).optional(),
        mode: z.enum([
          "rewrite",
          "summarize",
          "translate",
          "grammar",
          "sop",
          "meeting",
          "proposal",
          "contract",
        ]),
        language: z.string().trim().max(40).optional(),
        content: z.string().max(100_000).optional(),
      }),
      execute: async (ctx, input) => {
        let documentId = input.documentId;
        let source = input.content ?? "";
        if (!source) {
          const docs = await listDocuments({
            workspaceId: ctx.workspaceId,
            query: input.titleQuery,
            limit: 20,
          });
          const match = documentId
            ? docs.find((doc) => doc.id === documentId)
            : docs[0];
          if (!match) throw new Error("Document not found.");
          documentId = match.id;
          source = match.content;
        }
        const next = transformText(source, input.mode, input.language);
        if (documentId) {
          const document = await updateDocument({
            workspaceId: ctx.workspaceId,
            userId: ctx.userId,
            id: documentId,
            content: next,
            createVersion: true,
          });
          return { documentId: document.id, content: next };
        }
        return { content: next };
      },
    },
    {
      name: "generateDocumentFromPrompt",
      description: "Generate SOP, meeting notes, proposal, or contract document",
      requiredRole: "Sales",
      schema: z.object({
        title: z.string().trim().min(1).max(200),
        mode: z.enum(["sop", "meeting", "proposal", "contract"]),
        brief: z.string().trim().max(4000),
      }),
      execute: async (ctx, input) => {
        const content = transformText(input.brief, input.mode);
        const document = await createDocument({
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          title: input.title,
          content,
        });
        return { document };
      },
    },
    {
      name: "answerFromCompanyKnowledge",
      description: "Answer a question from the company knowledge base",
      requiredRole: "Sales",
      schema: z.object({ question: z.string().trim().min(1).max(500) }),
      execute: async (ctx, input) =>
        answerFromKnowledgeBase({
          workspaceId: ctx.workspaceId,
          question: input.question,
        }),
    },
    {
      name: "publishKnowledgeArticle",
      description: "Publish a knowledge base article",
      requiredRole: "Manager",
      schema: z.object({
        title: z.string().trim().min(1).max(200),
        body: z.string().max(100_000),
        category: z
          .enum(["wiki", "company", "policies", "guides", "playbooks"])
          .optional(),
      }),
      execute: async (ctx, input) => {
        const article = await createKnowledgeArticle({
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          title: input.title,
          body: input.body,
          category: input.category,
        });
        return { article };
      },
    },
  ];
  return tools;
}
