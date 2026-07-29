import { z } from "zod";
import { getUser } from "@repo/auth/server";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { mapWorkspaceRoleToKairosRole } from "../../../../lib/kairos-actions/registry";
import { executeKairosActionCommand } from "../../../../lib/kairos-actions/service";

const requestSchema = z.object({
  command: z.string().trim().min(1).max(2000),
  confirm: z.boolean().optional(),
  currentRoute: z.string().max(500).optional(),
  selectedRecords: z
    .array(
      z.object({
        type: z.string().max(80),
        id: z.string().max(200),
        label: z.string().max(200).optional(),
      }),
    )
    .max(20)
    .optional(),
});

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json(
      {
        ok: false,
        status: "failed",
        phase: "failed",
        message: "Unauthorized",
        timeline: [],
      },
      { status: 401 },
    );
  }

  const workspaceContext = await resolveActiveWorkspace();
  if (!workspaceContext) {
    return Response.json(
      {
        ok: false,
        status: "failed",
        phase: "failed",
        message: "No active workspace",
        timeline: [],
      },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        ok: false,
        status: "validation_failed",
        phase: "failed",
        message: "Invalid JSON body",
        timeline: [],
      },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        status: "validation_failed",
        phase: "failed",
        message: parsed.error.issues[0]?.message ?? "Invalid request body",
        timeline: [],
      },
      { status: 400 },
    );
  }

  const result = await executeKairosActionCommand({
    context: {
      userId: user.id,
      userEmail: workspaceContext.email,
      workspaceId: workspaceContext.active.workspace.id,
      workspaceName: workspaceContext.active.workspace.name,
      workspaceRole: workspaceContext.active.role,
      agentRole: mapWorkspaceRoleToKairosRole(workspaceContext.active.role),
      selectedRecords: parsed.data.selectedRecords ?? [],
      currentRoute: parsed.data.currentRoute,
    },
    command: parsed.data.command,
    confirm: parsed.data.confirm,
  });

  const statusCode =
    result.status === "completed"
      ? 200
      : result.status === "confirmation_required"
        ? 409
        : result.status === "unauthorized"
          ? 403
          : result.status === "validation_failed"
            ? 400
            : 200;

  return Response.json(result, { status: statusCode });
}
