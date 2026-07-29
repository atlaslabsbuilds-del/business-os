import type {
  KairosActionResponse,
  KairosActionSelectedRecord,
} from "./kairos-actions/types";

export async function executeKairosActionRequest(input: {
  command: string;
  confirm?: boolean;
  currentRoute?: string;
  selectedRecords?: KairosActionSelectedRecord[];
}): Promise<KairosActionResponse> {
  const response = await fetch("/api/kairos/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  let payload: KairosActionResponse | null = null;
  try {
    payload = (await response.json()) as KairosActionResponse;
  } catch {
    // handled below
  }

  if (!payload) {
    throw new Error("Invalid action response");
  }

  if (!response.ok && payload.status !== "confirmation_required") {
    throw new Error("message" in payload ? payload.message : "Action request failed");
  }

  return payload;
}
