import type {
  KairosActionSelectedRecord,
  KairosParsedCommand,
} from "./types";

const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

function pickSelectedRecordId(
  selectedRecords: KairosActionSelectedRecord[] | undefined,
  type: string,
): string | undefined {
  return selectedRecords?.find((record) => record.type === type)?.id;
}

function parseName(input: string): { firstName: string; lastName?: string } {
  const cleaned = input.trim().replace(/^named\s+/i, "");
  const [firstName, ...rest] = cleaned.split(/\s+/).filter(Boolean);
  return {
    firstName: firstName || "New",
    lastName: rest.join(" ") || undefined,
  };
}

function parseAmount(command: string): number | undefined {
  const moneyMatch = command.match(/\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
  if (!moneyMatch) return undefined;
  const value = Number(moneyMatch[1]);
  return Number.isFinite(value) ? value : undefined;
}

function parseStage(
  command: string,
):
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost"
  | undefined {
  const stageMatch = command.match(
    /\b(lead|qualified|proposal|negotiation|won|lost)\b/i,
  );
  if (!stageMatch) return undefined;
  return stageMatch[1]!.toLowerCase() as
    | "lead"
    | "qualified"
    | "proposal"
    | "negotiation"
    | "won"
    | "lost";
}

export function parseKairosActionCommand(input: {
  command: string;
  selectedRecords?: KairosActionSelectedRecord[];
}): KairosParsedCommand | null {
  const raw = input.command.trim();
  if (!raw) return null;
  const command = raw.toLowerCase();
  const selectedRecords = input.selectedRecords ?? [];

  if (/^create\s+(a\s+)?customer\b/.test(command)) {
    const tail = raw.replace(/^create\s+(a\s+)?customer\b/i, "").trim();
    const name = parseName(tail);
    return {
      tool: "createCustomer",
      label: "Create customer",
      input: {
        firstName: name.firstName,
        lastName: name.lastName,
      },
    };
  }

  if (/^create\s+(a\s+)?lead\b/.test(command)) {
    const tail = raw.replace(/^create\s+(a\s+)?lead\b/i, "").trim();
    const name = parseName(tail);
    return {
      tool: "createLead",
      label: "Create lead",
      input: {
        firstName: name.firstName,
        lastName: name.lastName,
      },
    };
  }

  if (/^create\s+(a\s+)?deal\b/.test(command)) {
    const tail = raw.replace(/^create\s+(a\s+)?deal\b/i, "").trim();
    const amount = parseAmount(raw);
    return {
      tool: "createDeal",
      label: "Create deal",
      input: {
        title: tail || "New deal",
        amount,
        contactId: pickSelectedRecordId(selectedRecords, "customer"),
      },
    };
  }

  if (
    /^(update|move)\s+deal\b/.test(command) &&
    /\b(stage|to)\b/.test(command)
  ) {
    const stage = parseStage(raw);
    const dealId =
      raw.match(UUID_RE)?.[0] ?? pickSelectedRecordId(selectedRecords, "deal");
    return {
      tool: "updateDealStage",
      label: "Update deal stage",
      input: {
        dealId,
        stage,
      },
    };
  }

  if (/^create\s+(an?\s+)?invoice\b/.test(command)) {
    const amount = parseAmount(raw) ?? 0;
    const customerTail = raw
      .replace(/^create\s+(an?\s+)?invoice\b/i, "")
      .replace(/\$?\s*[0-9]+(?:\.[0-9]{1,2})?/g, "")
      .trim();
    return {
      tool: "createInvoice",
      label: "Create invoice",
      input: {
        customerName: customerTail || "Customer",
        amount,
        customerId: pickSelectedRecordId(selectedRecords, "customer"),
      },
    };
  }

  if (/^(schedule|create)\s+(a\s+)?meeting\b/.test(command)) {
    const title =
      raw.replace(/^(schedule|create)\s+(a\s+)?meeting\b/i, "").trim() ||
      "Follow-up meeting";
    const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
    return {
      tool: "scheduleMeeting",
      label: "Schedule meeting",
      input: {
        title,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        threadId: pickSelectedRecordId(selectedRecords, "thread"),
      },
    };
  }

  if (/^create\s+(a\s+)?task\b/.test(command)) {
    const title = raw.replace(/^create\s+(a\s+)?task\b/i, "").trim();
    return {
      tool: "createTask",
      label: "Create task",
      input: {
        title: title || "Follow up task",
        threadId: pickSelectedRecordId(selectedRecords, "thread"),
      },
    };
  }

  if (/^assign\s+task\b/.test(command)) {
    const title = raw
      .replace(/^assign\s+task\b/i, "")
      .replace(/\s+to\s+.+$/i, "")
      .trim();
    return {
      tool: "assignTask",
      label: "Assign task",
      input: {
        title: title || "Assigned task",
        threadId: pickSelectedRecordId(selectedRecords, "thread"),
      },
    };
  }

  if (
    /(send|draft)\s+(a\s+)?follow[- ]?up email\b/.test(command) ||
    /follow[- ]?up email.*draft/.test(command)
  ) {
    return {
      tool: "sendFollowUpEmailDraft",
      label: "Send follow-up email (draft only)",
      input: {
        threadId: pickSelectedRecordId(selectedRecords, "thread"),
        body:
          "Hi there,\n\nFollowing up on our earlier conversation. Let me know if you have any questions.\n\nBest regards,",
      },
    };
  }

  if (/^(add|create)\s+(a\s+)?crm note\b/.test(command)) {
    const body = raw.replace(/^(add|create)\s+(a\s+)?crm note\b/i, "").trim();
    return {
      tool: "addCrmNote",
      label: "Add CRM note",
      input: {
        body: body || "Added by Kairos.",
        contactId: pickSelectedRecordId(selectedRecords, "customer"),
        dealId: pickSelectedRecordId(selectedRecords, "deal"),
      },
    };
  }

  if (/^(search|find|lookup)\s+customer\b/.test(command)) {
    const query = raw.replace(/^(search|find|lookup)\s+customer(s)?\b/i, "").trim();
    return {
      tool: "searchCustomer",
      label: "Search customer",
      input: { query },
    };
  }

  if (/^(search|find|lookup)\s+deals?\b/.test(command)) {
    const query = raw.replace(/^(search|find|lookup)\s+deals?\b/i, "").trim();
    return {
      tool: "searchDeals",
      label: "Search deals",
      input: { query },
    };
  }

  if (/^(search|find|lookup)\s+invoices?\b/.test(command)) {
    const query = raw.replace(/^(search|find|lookup)\s+invoices?\b/i, "").trim();
    return {
      tool: "searchInvoices",
      label: "Search invoices",
      input: { query },
    };
  }

  if (
    /^show\s+dashboard\s+summary\b/.test(command) ||
    /^dashboard\s+summary\b/.test(command)
  ) {
    return {
      tool: "showDashboardSummary",
      label: "Show dashboard summary",
      input: {},
    };
  }

  if (/^delete\s+customer\b/.test(command)) {
    const id =
      raw.match(UUID_RE)?.[0] ?? pickSelectedRecordId(selectedRecords, "customer");
    return {
      tool: "deleteCustomer",
      label: "Delete customer",
      input: { id },
    };
  }

  if (/^delete\s+deal\b/.test(command)) {
    const id = raw.match(UUID_RE)?.[0] ?? pickSelectedRecordId(selectedRecords, "deal");
    return {
      tool: "deleteDeal",
      label: "Delete deal",
      input: { id },
    };
  }

  if (/^delete\s+invoice\b/.test(command)) {
    const id =
      raw.match(UUID_RE)?.[0] ?? pickSelectedRecordId(selectedRecords, "invoice");
    return {
      tool: "deleteInvoice",
      label: "Delete invoice",
      input: { id },
    };
  }

  if (
    /summarize\s+(today'?s\s+)?gmail\b/.test(command) ||
    /gmail\s+summary\b/.test(command)
  ) {
    return {
      tool: "summarizeGmail",
      label: "Summarize Gmail",
      input: { query: "today" },
    };
  }

  if (/upload\s+.+\s+to\s+(google\s+)?drive\b/.test(command)) {
    const fileName =
      raw
        .replace(/^upload\s+/i, "")
        .replace(/\s+to\s+(google\s+)?drive\b.*$/i, "")
        .trim() || "file";
    return {
      tool: "uploadToGoogleDrive",
      label: "Upload to Google Drive",
      input: { fileName },
    };
  }

  if (
    /schedule\s+(tomorrow'?s\s+)?meeting\b/.test(command) ||
    /create\s+(a\s+)?(google\s+)?calendar\s+meeting\b/.test(command)
  ) {
    const title =
      raw
        .replace(/^schedule\s+(tomorrow'?s\s+)?meeting\b/i, "")
        .replace(/^create\s+(a\s+)?(google\s+)?calendar\s+meeting\b/i, "")
        .trim() || "Meeting";
    return {
      tool: "createCalendarMeeting",
      label: "Create calendar meeting",
      input: { title, when: "tomorrow" },
    };
  }

  if (/post\s+(this\s+)?to\s+slack\b/.test(command) || /send\s+to\s+slack\b/.test(command)) {
    const message =
      raw
        .replace(/^post\s+(this\s+)?to\s+slack\b[:\s-]*/i, "")
        .replace(/^send\s+to\s+slack\b[:\s-]*/i, "")
        .trim() || "Update from Kairos";
    return {
      tool: "postToSlack",
      label: "Post to Slack",
      input: { message },
    };
  }

  if (/create\s+(a\s+)?github\s+issue\b/.test(command)) {
    const title =
      raw.replace(/^create\s+(a\s+)?github\s+issue\b/i, "").trim() || "New issue";
    return {
      tool: "createGitHubIssue",
      label: "Create GitHub issue",
      input: { title },
    };
  }

  if (/list\s+(stripe\s+)?payments\b/.test(command) || /show\s+stripe\s+payments\b/.test(command)) {
    return {
      tool: "listStripePayments",
      label: "List Stripe payments",
      input: { limit: 10 },
    };
  }

  if (/create\s+(a\s+)?notion\s+page\b/.test(command)) {
    const title =
      raw.replace(/^create\s+(a\s+)?notion\s+page\b/i, "").trim() || "Untitled";
    return {
      tool: "createNotionPage",
      label: "Create Notion page",
      input: { title },
    };
  }

  if (
    /list\s+connected\s+integrations\b/.test(command) ||
    /what\s+integrations\s+(are\s+)?connected\b/.test(command)
  ) {
    return {
      tool: "listConnectedIntegrations",
      label: "List connected integrations",
      input: {},
    };
  }

  if (
    /how\s+much\s+did\s+we\s+spend\s+this\s+month\b/.test(command) ||
    /summarize\s+(monthly\s+)?spending\b/.test(command)
  ) {
    return {
      tool: "summarizeMonthlySpending",
      label: "Summarize monthly spending",
      input: {},
    };
  }

  if (
    /show\s+(the\s+)?highest\s+expenses\b/.test(command) ||
    /find\s+(the\s+)?largest\s+expenses\b/.test(command)
  ) {
    return {
      tool: "showHighestExpenses",
      label: "Show highest expenses",
      input: { limit: 5 },
    };
  }

  if (
    /summarize\s+(financial|finance)\s+performance\b/.test(command) ||
    /financial\s+summary\b/.test(command)
  ) {
    return {
      tool: "summarizeFinancialPerformance",
      label: "Summarize financial performance",
      input: {},
    };
  }

  if (
    /predict\s+next\s+month'?s\s+revenue\b/.test(command) ||
    /forecast\s+next\s+month'?s\s+revenue\b/.test(command)
  ) {
    return {
      tool: "predictNextMonthRevenue",
      label: "Predict next month's revenue",
      input: {},
    };
  }

  if (/generate\s+(a\s+)?monthly\s+(finance\s+)?report\b/.test(command)) {
    return {
      tool: "generateMonthlyFinanceReport",
      label: "Generate monthly finance report",
      input: {},
    };
  }

  if (/find\s+(unnecessary|non[- ]essential)\s+expenses\b/.test(command)) {
    return {
      tool: "findUnnecessaryExpenses",
      label: "Find unnecessary expenses",
      input: {},
    };
  }

  if (
    /show\s+hot\s+leads\b/.test(command) ||
    /list\s+hot\s+leads\b/.test(command)
  ) {
    return {
      tool: "showHotLeads",
      label: "Show hot leads",
      input: { limit: 8 },
    };
  }

  if (
    /summarize\s+(customer|contact)\s+history\b/.test(command) ||
    /summarize\s+this\s+customer\b/.test(command)
  ) {
    const customerName = raw
      .replace(/summarize\s+(customer|contact)\s+history\b/i, "")
      .replace(/summarize\s+this\s+customer\b/i, "")
      .trim();
    return {
      tool: "summarizeCustomerHistory",
      label: "Summarize customer history",
      input: {
        customerName: customerName || undefined,
        contactId: pickSelectedRecordId(selectedRecords, "customer"),
      },
    };
  }

  if (
    /predict\s+which\s+deals\s+will\s+close\b/.test(command) ||
    /predict\s+deal\s+closures?\b/.test(command)
  ) {
    return {
      tool: "predictDealClosures",
      label: "Predict which deals will close",
      input: { limit: 5 },
    };
  }

  if (
    /generate\s+(a\s+)?follow[- ]up\s+email\b/.test(command) ||
    /draft\s+(a\s+)?follow[- ]up\s+email\b/.test(command)
  ) {
    const topic = raw
      .replace(/^(generate|draft)\s+(a\s+)?follow[- ]up\s+email\b/i, "")
      .trim();
    return {
      tool: "generateFollowUpEmail",
      label: "Generate follow-up email",
      input: {
        topic: topic || undefined,
        contactId: pickSelectedRecordId(selectedRecords, "customer"),
      },
    };
  }

  if (
    /find\s+inactive\s+customers\b/.test(command) ||
    /show\s+inactive\s+customers\b/.test(command)
  ) {
    return {
      tool: "findInactiveCustomers",
      label: "Find inactive customers",
      input: { days: 30 },
    };
  }

  if (
    /suggest\s+next\s+sales\s+actions\b/.test(command) ||
    /what\s+should\s+i\s+do\s+next\s+in\s+(sales|crm)\b/.test(command)
  ) {
    return {
      tool: "suggestNextSalesActions",
      label: "Suggest next sales actions",
      input: {},
    };
  }

  if (/^create\s+(a\s+)?new\s+project\b/.test(command) || /^create\s+(a\s+)?project\b/.test(command)) {
    const name = raw
      .replace(/^create\s+(a\s+)?(new\s+)?project\b/i, "")
      .trim() || "New project";
    return {
      tool: "createProject",
      label: "Create a new project",
      input: { name },
    };
  }

  if (/summarize\s+today'?s\s+tasks\b/.test(command)) {
    return {
      tool: "summarizeTodaysTasks",
      label: "Summarize today's tasks",
      input: {},
    };
  }

  if (/move\s+all\s+overdue\s+tasks\b/.test(command)) {
    return {
      tool: "moveOverdueProjectTasks",
      label: "Move all overdue tasks",
      input: {},
    };
  }

  if (/generate\s+(a\s+)?project\s+report\b/.test(command)) {
    return {
      tool: "generateProjectHealthReport",
      label: "Generate project report",
      input: {},
    };
  }

  if (/estimate\s+project\s+completion\b/.test(command)) {
    return {
      tool: "estimateProjectCompletion",
      label: "Estimate project completion",
      input: {},
    };
  }

  if (/assign\s+tasks\s+automatically\b/.test(command)) {
    return {
      tool: "assignTasksAutomatically",
      label: "Assign tasks automatically",
      input: {},
    };
  }

  if (/^(write|create)\s+(a\s+)?document\b/.test(command)) {
    const title =
      raw.replace(/^(write|create)\s+(a\s+)?document\b/i, "").trim() || "Untitled";
    return {
      tool: "writeDocument",
      label: "Write document",
      input: { title },
    };
  }

  if (/rewrite\s+(this\s+)?(document|content)\b/.test(command)) {
    return {
      tool: "rewriteDocumentContent",
      label: "Rewrite content",
      input: { mode: "rewrite" },
    };
  }

  if (/summarize\s+(this\s+)?document\b/.test(command)) {
    return {
      tool: "rewriteDocumentContent",
      label: "Summarize document",
      input: { mode: "summarize" },
    };
  }

  if (/translate\s+(this\s+)?(document|content)\b/.test(command)) {
    return {
      tool: "rewriteDocumentContent",
      label: "Translate content",
      input: { mode: "translate", language: "es" },
    };
  }

  if (/fix\s+grammar\b/.test(command)) {
    return {
      tool: "rewriteDocumentContent",
      label: "Fix grammar",
      input: { mode: "grammar" },
    };
  }

  if (/generate\s+(an?\s+)?sop\b/.test(command)) {
    const brief = raw.replace(/generate\s+(an?\s+)?sop\b/i, "").trim() || "Operational workflow";
    return {
      tool: "generateDocumentFromPrompt",
      label: "Generate SOP",
      input: { title: "SOP", mode: "sop", brief },
    };
  }

  if (/generate\s+meeting\s+notes\b/.test(command)) {
    const brief =
      raw.replace(/generate\s+meeting\s+notes\b/i, "").trim() || "Team sync";
    return {
      tool: "generateDocumentFromPrompt",
      label: "Generate meeting notes",
      input: { title: "Meeting notes", mode: "meeting", brief },
    };
  }

  if (/create\s+(a\s+)?proposal\b/.test(command)) {
    const brief = raw.replace(/create\s+(a\s+)?proposal\b/i, "").trim() || "Proposal brief";
    return {
      tool: "generateDocumentFromPrompt",
      label: "Create proposal",
      input: { title: "Proposal", mode: "proposal", brief },
    };
  }

  if (/create\s+(a\s+)?contract\b/.test(command)) {
    const brief = raw.replace(/create\s+(a\s+)?contract\b/i, "").trim() || "Service agreement";
    return {
      tool: "generateDocumentFromPrompt",
      label: "Create contract",
      input: { title: "Contract", mode: "contract", brief },
    };
  }

  if (
    /answer\s+from\s+(the\s+)?(company\s+)?knowledge\s+base\b/.test(command) ||
    /ask\s+knowledge\s+base\b/.test(command)
  ) {
    const question = raw
      .replace(/answer\s+from\s+(the\s+)?(company\s+)?knowledge\s+base\b/i, "")
      .replace(/ask\s+knowledge\s+base\b/i, "")
      .trim();
    return {
      tool: "answerFromCompanyKnowledge",
      label: "Answer from company knowledge base",
      input: { question: question || "What policies do we have?" },
    };
  }

  if (/schedule\s+tomorrow'?s\s+meeting/.test(command)) return { tool: "scheduleTomorrowMeeting", label: "Schedule tomorrow's meeting", input: { title: "Tomorrow meeting" } };
  if (/find\s+a\s+free\s+time|find\s+calendar\s+availability/.test(command)) return { tool: "findCalendarAvailability", label: "Find a free time", input: {} };
  if (/summarize\s+today'?s\s+calendar/.test(command)) return { tool: "summarizeTodaysCalendar", label: "Summarize today's calendar", input: {} };
  if (/prepare\s+(an?\s+)?agenda/.test(command)) return { tool: "prepareMeetingAgenda", label: "Prepare agenda", input: {} };
  if (/schedule\s+follow[- ]up/.test(command)) return { tool: "scheduleFollowUpMeeting", label: "Schedule follow-up", input: {} };
  if (/show\s+business\s+health/.test(command)) return { tool: "showBusinessHealth", label: "Show business health", input: {} };
  if (/predict\s+next\s+month'?s\s+growth/.test(command)) return { tool: "predictNextMonthGrowth", label: "Predict next month's growth", input: {} };
  if (/summarize\s+analytics/.test(command)) return { tool: "summarizeAnalytics", label: "Summarize analytics", input: {} };
  if (/find\s+business\s+bottlenecks/.test(command)) return { tool: "findBusinessBottlenecks", label: "Find business bottlenecks", input: {} };
  if (/generate\s+(an?\s+)?executive\s+report/.test(command)) return { tool: "generateExecutiveReport", label: "Generate executive report", input: {} };

  return null;
}
