"use server";

import { submitContactMessage } from "@repo/database/contact";

export async function submitContactAction(input: {
  name: string;
  email: string;
  company?: string | null;
  message: string;
}) {
  return submitContactMessage(input);
}
