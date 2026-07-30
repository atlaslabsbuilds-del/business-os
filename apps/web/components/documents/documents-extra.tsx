"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import type {
  DocFolder,
  DocumentComment,
  DocumentSettings,
  DocumentShare,
  DocumentVersion,
  KnowledgeArticle,
  WorkspaceDocument,
} from "@repo/types";
import {
  autosaveDocumentAction,
  createDocumentAction,
  createDocumentCommentAction,
  createDocumentShareAction,
  createFolderAction,
  createKnowledgeArticleAction,
  deleteFolderAction,
  trashDocumentAction,
  updateDocumentSettingsAction,
  updateFolderAction,
} from "../../app/(protected)/actions/documents";

const inputClass =
  "w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm outline-none focus:border-primary/50";

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-secondary">
      {text}
    </div>
  );
}

const SLASH_COMMANDS = [
  { key: "/h1", label: "Heading 1", insert: "# " },
  { key: "/h2", label: "Heading 2", insert: "## " },
  { key: "/list", label: "Bullet list", insert: "- " },
  { key: "/todo", label: "Checklist", insert: "- [ ] " },
  { key: "/code", label: "Code block", insert: "```\n\n```\n" },
  { key: "/quote", label: "Quote", insert: "> " },
  { key: "/callout", label: "Callout", insert: "> **Note:** " },
  { key: "/table", label: "Table", insert: "| Col | Col |\n| --- | --- |\n|  |  |\n" },
  { key: "/divider", label: "Divider", insert: "\n---\n" },
];

export function DocumentsListPanel({
  documents,
  title = "Documents",
}: {
  documents: WorkspaceDocument[];
  title?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-secondary">{documents.length} items</p>
        </div>
        <Button
          loading={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await createDocumentAction({ title: "Untitled" });
              if (!result.ok) setError(result.error);
              else router.push(`/documents/${result.data.id}`);
            });
          }}
        >
          New document
        </Button>
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {documents.length === 0 ? (
        <EmptyPanel text="No documents in this view yet." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} elevated className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="truncate text-base font-medium text-foreground hover:text-accent"
                  >
                    {doc.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-secondary">
                    {doc.summary || doc.content.slice(0, 120) || "Empty document"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="default">{doc.status}</Badge>
                    {doc.isTemplate ? <Badge variant="accent">Template</Badge> : null}
                    {doc.isFavorite ? <Badge variant="warning">Favorite</Badge> : null}
                    <Badge variant="default">{doc.wordCount} words</Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={pending}
                  onClick={() => {
                    startTransition(async () => {
                      await trashDocumentAction({ id: doc.id });
                      router.refresh();
                    });
                  }}
                >
                  Trash
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function DocumentsFoldersPanel({ folders }: { folders: DocFolder[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const roots = folders.filter((folder) => !folder.parentId);

  return (
    <div className="space-y-4">
      <Card elevated>
        <CardHeader>
          <CardTitle>Create folder</CardTitle>
          <CardDescription>Nested folders with favorites and archive.</CardDescription>
        </CardHeader>
        <form
          className="grid gap-3 px-5 pb-5 sm:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setError(null);
            startTransition(async () => {
              const parentId = String(form.get("parentId") ?? "") || null;
              const result = await createFolderAction({
                name: String(form.get("name") ?? ""),
                parentId,
              });
              if (!result.ok) setError(result.error);
              else {
                event.currentTarget.reset();
                router.refresh();
              }
            });
          }}
        >
          <input name="name" required placeholder="Folder name" className={inputClass} />
          <Button type="submit" loading={pending}>
            Create
          </Button>
          <select name="parentId" className={`${inputClass} sm:col-span-2`}>
            <option value="">Root folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                Nest under {folder.name}
              </option>
            ))}
          </select>
          {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
        </form>
      </Card>

      {roots.length === 0 ? (
        <EmptyPanel text="No folders yet." />
      ) : (
        <div className="space-y-2">
          {folders.map((folder) => (
            <Card key={folder.id} elevated className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{folder.name}</p>
                  <p className="text-xs text-muted">
                    {folder.parentId ? `Child of ${folder.parentId.slice(0, 8)}…` : "Root"} · pos{" "}
                    {folder.position}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={pending}
                    onClick={() => {
                      startTransition(async () => {
                        await updateFolderAction({
                          id: folder.id,
                          isFavorite: !folder.isFavorite,
                        });
                        router.refresh();
                      });
                    }}
                  >
                    {folder.isFavorite ? "Unfavorite" : "Favorite"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={pending}
                    onClick={() => {
                      startTransition(async () => {
                        await deleteFolderAction({ id: folder.id });
                        router.refresh();
                      });
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function KnowledgeBasePanel({ articles }: { articles: KnowledgeArticle[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Card elevated>
        <CardHeader>
          <CardTitle>Publish knowledge article</CardTitle>
          <CardDescription>Wiki, policies, guides, and playbooks searchable by Kairos.</CardDescription>
        </CardHeader>
        <form
          className="grid gap-3 px-5 pb-5 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setError(null);
            startTransition(async () => {
              const result = await createKnowledgeArticleAction({
                title: String(form.get("title") ?? ""),
                category: String(form.get("category") ?? "guides"),
                summary: String(form.get("summary") ?? "") || null,
                body: String(form.get("body") ?? ""),
                tags: String(form.get("tags") ?? "")
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              });
              if (!result.ok) setError(result.error);
              else {
                event.currentTarget.reset();
                router.refresh();
              }
            });
          }}
        >
          <input name="title" required placeholder="Article title" className={inputClass} />
          <select name="category" defaultValue="guides" className={inputClass}>
            <option value="wiki">Wiki</option>
            <option value="company">Company</option>
            <option value="policies">Policies</option>
            <option value="guides">Guides</option>
            <option value="playbooks">Playbooks</option>
          </select>
          <input name="summary" placeholder="Summary" className={`${inputClass} sm:col-span-2`} />
          <input name="tags" placeholder="Tags" className={`${inputClass} sm:col-span-2`} />
          <textarea
            name="body"
            required
            placeholder="Article body"
            className={`${inputClass} min-h-32 sm:col-span-2`}
          />
          <Button type="submit" loading={pending}>
            Publish
          </Button>
          {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
        </form>
      </Card>
      {articles.length === 0 ? (
        <EmptyPanel text="Knowledge base is empty." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {articles.map((article) => (
            <Card key={article.id} elevated className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{article.title}</p>
                  <p className="mt-1 text-sm text-secondary">
                    {article.summary || article.body.slice(0, 140)}
                  </p>
                </div>
                <Badge variant="accent">{article.category}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function DocumentsSettingsPanel({ settings }: { settings: DocumentSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card elevated>
      <CardHeader>
        <CardTitle>Document settings</CardTitle>
        <CardDescription>Autosave, templates, and default share permissions.</CardDescription>
      </CardHeader>
      <form
        className="grid gap-3 px-5 pb-5 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError(null);
          startTransition(async () => {
            const result = await updateDocumentSettingsAction({
              autosaveSeconds: Number(form.get("autosaveSeconds") ?? 3),
              enableTemplates: form.get("enableTemplates") === "on",
              defaultSharePermission: String(form.get("defaultSharePermission") ?? "view"),
            });
            if (!result.ok) setError(result.error);
            else router.refresh();
          });
        }}
      >
        <input
          name="autosaveSeconds"
          type="number"
          min={1}
          max={60}
          defaultValue={settings.autosaveSeconds}
          className={inputClass}
        />
        <select
          name="defaultSharePermission"
          defaultValue={settings.defaultSharePermission}
          className={inputClass}
        >
          <option value="view">View</option>
          <option value="comment">Comment</option>
          <option value="edit">Edit</option>
          <option value="owner">Owner</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-secondary sm:col-span-2">
          <input
            name="enableTemplates"
            type="checkbox"
            defaultChecked={settings.enableTemplates}
          />
          Enable templates
        </label>
        <Button type="submit" loading={pending}>
          Save settings
        </Button>
        {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
      </form>
    </Card>
  );
}

export function DocumentEditor({
  document,
  versions,
  comments,
  shares,
}: {
  document: WorkspaceDocument;
  versions: DocumentVersion[];
  comments: DocumentComment[];
  shares: DocumentShare[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [slash, setSlash] = useState("");
  const [pending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const [shareEmail, setShareEmail] = useState("");

  const filteredCommands = useMemo(() => {
    if (!slash.startsWith("/")) return [];
    return SLASH_COMMANDS.filter((command) => command.key.startsWith(slash.toLowerCase()));
  }, [slash]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (title === document.title && content === document.content) return;
      setStatus("saving");
      startTransition(async () => {
        const result = await autosaveDocumentAction({
          id: document.id,
          title,
          content,
        });
        setStatus(result.ok ? "saved" : "error");
      });
    }, 900);
    return () => window.clearTimeout(handle);
  }, [title, content, document.id, document.title, document.content]);

  function insertSnippet(snippet: string) {
    setContent((prev) => `${prev}${prev.endsWith("\n") || !prev ? "" : "\n"}${snippet}`);
    setSlash("");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
      <Card elevated className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          {["# ", "## ", "- ", "> ", "```\n\n```\n", "| A | B |\n| --- | --- |\n"].map(
            (snippet, index) => (
              <Button
                key={snippet}
                size="sm"
                variant="secondary"
                onClick={() => insertSnippet(snippet)}
              >
                {["H1", "H2", "List", "Quote", "Code", "Table"][index]}
              </Button>
            ),
          )}
          <span className="ml-auto text-xs text-muted">
            {status === "saving"
              ? "Saving…"
              : status === "saved"
                ? "Saved"
                : status === "error"
                  ? "Save failed"
                  : "Autosave on"}
          </span>
        </div>
        <div className="space-y-3 p-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full bg-transparent text-2xl font-semibold outline-none"
            placeholder="Untitled"
          />
          <div className="relative">
            <textarea
              value={content}
              onChange={(event) => {
                const value = event.target.value;
                setContent(value);
                const match = value.split("\n").pop()?.match(/\/[a-z0-9]*$/i);
                setSlash(match?.[0] ?? "");
              }}
              className="min-h-[420px] w-full resize-y rounded-2xl border border-border bg-elevated/40 p-4 font-mono text-sm outline-none focus:border-primary/40"
              placeholder="Write in Markdown. Type / for slash commands…"
            />
            {filteredCommands.length > 0 ? (
              <div className="bos-glass-strong absolute bottom-4 left-4 z-10 min-w-[220px] overflow-hidden rounded-2xl border border-border">
                {filteredCommands.map((command) => (
                  <button
                    key={command.key}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-elevated"
                    onClick={() => {
                      setContent((prev) => prev.replace(/\/[a-z0-9]*$/i, command.insert));
                      setSlash("");
                    }}
                  >
                    <span className="font-medium">{command.label}</span>
                    <span className="ml-2 text-xs text-muted">{command.key}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card elevated>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Markdown with tables, lists, and code.</CardDescription>
          </CardHeader>
          <div className="prose prose-invert max-w-none px-5 pb-5 text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || "_Start writing…_"}
            </ReactMarkdown>
          </div>
        </Card>

        <Card elevated>
          <CardHeader>
            <CardTitle>Share</CardTitle>
            <CardDescription>View · Comment · Edit · Owner</CardDescription>
          </CardHeader>
          <form
            className="space-y-3 px-5 pb-5"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                await createDocumentShareAction({
                  documentId: document.id,
                  email: shareEmail,
                  permission: "comment",
                });
                setShareEmail("");
                router.refresh();
              });
            }}
          >
            <input
              value={shareEmail}
              onChange={(event) => setShareEmail(event.target.value)}
              type="email"
              required
              placeholder="teammate@company.com"
              className={inputClass}
            />
            <Button type="submit" loading={pending} size="sm">
              Share
            </Button>
            <ul className="space-y-2">
              {shares.map((share) => (
                <li
                  key={share.id}
                  className="flex items-center justify-between rounded-xl bg-elevated/60 px-3 py-2 text-sm"
                >
                  <span>{share.email || share.userId}</span>
                  <Badge variant="default">{share.permission}</Badge>
                </li>
              ))}
            </ul>
          </form>
        </Card>

        <Card elevated>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <form
            className="space-y-3 px-5 pb-5"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                await createDocumentCommentAction({
                  documentId: document.id,
                  body: comment,
                });
                setComment("");
                router.refresh();
              });
            }}
          >
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              required
              placeholder="Add a comment… use @mentions in prose"
              className={`${inputClass} min-h-20`}
            />
            <Button type="submit" loading={pending} size="sm">
              Comment
            </Button>
            <ul className="space-y-2">
              {comments.map((item) => (
                <li key={item.id} className="rounded-xl bg-elevated/60 px-3 py-2 text-sm">
                  {item.body}
                </li>
              ))}
            </ul>
          </form>
        </Card>

        <Card elevated>
          <CardHeader>
            <CardTitle>Version history</CardTitle>
            <CardDescription>Offline-ready checkpoints from saves.</CardDescription>
          </CardHeader>
          <ul className="space-y-2 px-5 pb-5">
            {versions.map((version) => (
              <li
                key={version.id}
                className="flex items-center justify-between rounded-xl bg-elevated/60 px-3 py-2 text-sm"
              >
                <span>v{version.versionNumber}</span>
                <span className="text-xs text-muted">
                  {new Date(version.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
