import { createAdminClient } from "./admin";

export type ContactMessageInput = {
  name: string;
  email: string;
  company?: string | null;
  message: string;
};

export async function submitContactMessage(input: ContactMessageInput) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const company = input.company?.trim() || null;
  const message = input.message.trim();

  if (!name || !email || !message) {
    return { ok: false as const, message: "Please complete all required fields." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, message: "Enter a valid email address." };
  }

  if (message.length < 10) {
    return { ok: false as const, message: "Please share a bit more detail in your message." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    company,
    message,
    status: "new",
  });

  if (error) {
    // Table may not exist yet in some environments — fail gracefully with clear message
    return {
      ok: false as const,
      message: "Unable to send your message right now. Please email hello@vanderbase.com.",
    };
  }

  return { ok: true as const };
}
