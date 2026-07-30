export type IntegrationActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
