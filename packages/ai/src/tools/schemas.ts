import { z } from "zod";

export type JsonSchema = Record<string, unknown>;

export class ToolValidationError extends Error {
  readonly issues: z.ZodIssue[];

  constructor(message: string, issues: z.ZodIssue[]) {
    super(message);
    this.name = "ToolValidationError";
    this.issues = issues;
  }
}

export function validateToolArgs<T extends z.ZodType>(
  schema: T,
  args: unknown,
): z.infer<T> {
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    throw new ToolValidationError(
      parsed.error.issues[0]?.message ?? "Invalid tool arguments",
      parsed.error.issues,
    );
  }
  return parsed.data;
}

export function zodToJsonSchema(schema: z.ZodType): JsonSchema {
  return convertZodType(schema);
}

function convertZodType(schema: z.ZodType): JsonSchema {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodType>;
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const unwrapped = unwrapOptionalDefault(value);
      properties[key] = convertZodType(unwrapped.schema);
      if (unwrapped.required) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
      additionalProperties: false,
    };
  }

  if (schema instanceof z.ZodString) {
    return { type: "string" };
  }

  if (schema instanceof z.ZodNumber) {
    return { type: "number" };
  }

  if (schema instanceof z.ZodBoolean) {
    return { type: "boolean" };
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: "array",
      items: convertZodType(schema.element as z.ZodType),
    };
  }

  if (schema instanceof z.ZodEnum) {
    return { type: "string", enum: [...schema.options] };
  }

  if (schema instanceof z.ZodLiteral) {
    return { const: schema.value };
  }

  if (schema instanceof z.ZodUnion) {
    const options = schema.options as z.ZodType[];
    return { oneOf: options.map(convertZodType) };
  }

  if (schema instanceof z.ZodRecord) {
    return {
      type: "object",
      additionalProperties: convertZodType(schema.valueType as z.ZodType),
    };
  }

  return { type: "object", additionalProperties: true };
}

function unwrapOptionalDefault(schema: z.ZodType): {
  schema: z.ZodType;
  required: boolean;
} {
  if (schema instanceof z.ZodOptional) {
    return { schema: schema.unwrap() as z.ZodType, required: false };
  }
  if (schema instanceof z.ZodDefault) {
    return { schema: schema.removeDefault() as z.ZodType, required: false };
  }
  return { schema, required: true };
}

export function parseToolArguments(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      throw new Error("Tool arguments must be a JSON object");
    } catch (error) {
      if (error instanceof Error && error.message.includes("JSON object")) {
        throw error;
      }
      throw new Error("Tool arguments must be valid JSON");
    }
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }

  return {};
}
