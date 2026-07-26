export type IntegrationCategory =
  | "ai"
  | "communication"
  | "productivity"
  | "development"
  | "payments"
  | "marketing"
  | "storage"
  | "crm"
  | "scheduling";

export type Integration = {
  id: string;
  name: string;
  categories: IntegrationCategory[];
  description: string;
  keywords?: string[];
};

export const INTEGRATION_FILTERS: { id: IntegrationCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ai", label: "AI" },
  { id: "communication", label: "Communication" },
  { id: "productivity", label: "Productivity" },
  { id: "development", label: "Development" },
  { id: "payments", label: "Payments" },
  { id: "marketing", label: "Marketing" },
  { id: "storage", label: "Storage" },
  { id: "crm", label: "CRM" },
  { id: "scheduling", label: "Scheduling" },
];

export const INTEGRATIONS: Integration[] = [
  { id: "google", name: "Google", categories: ["productivity"], description: "Workspace Sync", keywords: ["workspace", "google"] },
  { id: "gmail", name: "Gmail", categories: ["communication"], description: "Email Sync", keywords: ["email", "inbox"] },
  { id: "googlecalendar", name: "Google Calendar", categories: ["scheduling"], description: "Calendar Sync", keywords: ["calendar", "events"] },
  { id: "googledrive", name: "Google Drive", categories: ["storage"], description: "File Sync", keywords: ["drive", "files"] },
  { id: "slack", name: "Slack", categories: ["communication"], description: "Instant Team Notifications", keywords: ["chat", "teams"] },
  { id: "discord", name: "Discord", categories: ["communication"], description: "Community Alerts", keywords: ["community"] },
  { id: "notion", name: "Notion", categories: ["productivity"], description: "Knowledge Base", keywords: ["docs", "wiki"] },
  { id: "github", name: "GitHub", categories: ["development"], description: "Repositories", keywords: ["git", "code"] },
  { id: "gitlab", name: "GitLab", categories: ["development"], description: "DevOps Pipelines", keywords: ["ci", "cd"] },
  { id: "stripe", name: "Stripe", categories: ["payments"], description: "Payments", keywords: ["billing", "checkout"] },
  { id: "razorpay", name: "Razorpay", categories: ["payments"], description: "Global Payments", keywords: ["india", "upi"] },
  { id: "meta", name: "Meta", categories: ["marketing"], description: "Ads & Social Graph", keywords: ["facebook", "ads"] },
  { id: "instagram", name: "Instagram", categories: ["marketing"], description: "Social Publishing", keywords: ["social", "reels"] },
  { id: "facebook", name: "Facebook", categories: ["marketing"], description: "Page Management", keywords: ["pages"] },
  { id: "linkedin", name: "LinkedIn", categories: ["marketing"], description: "Professional Reach", keywords: ["b2b", "posts"] },
  { id: "x", name: "X", categories: ["marketing"], description: "Social Distribution", keywords: ["twitter"] },
  { id: "youtube", name: "YouTube", categories: ["marketing"], description: "Video Publishing", keywords: ["video"] },
  { id: "tiktok", name: "TikTok", categories: ["marketing"], description: "Short-form Content", keywords: ["video", "social"] },
  { id: "openai", name: "OpenAI", categories: ["ai"], description: "AI Generation", keywords: ["gpt", "chat"] },
  { id: "anthropic", name: "Anthropic", categories: ["ai"], description: "Claude Models", keywords: ["claude"] },
  { id: "googlegemini", name: "Gemini", categories: ["ai"], description: "Multimodal AI", keywords: ["gemini", "google ai"] },
  { id: "microsoft", name: "Microsoft", categories: ["productivity"], description: "Microsoft 365", keywords: ["office", "365"] },
  { id: "microsoftoutlook", name: "Outlook", categories: ["communication"], description: "Email & Calendar", keywords: ["outlook", "email"] },
  { id: "onedrive", name: "OneDrive", categories: ["storage"], description: "Cloud Storage", keywords: ["microsoft", "files"] },
  { id: "dropbox", name: "Dropbox", categories: ["storage"], description: "Shared Files", keywords: ["files", "sync"] },
  { id: "zoom", name: "Zoom", categories: ["communication", "scheduling"], description: "Video Meetings", keywords: ["video", "calls"] },
  { id: "amazonaws", name: "AWS", categories: ["development"], description: "Cloud Infrastructure", keywords: ["amazon", "cloud"] },
  { id: "cloudflare", name: "Cloudflare", categories: ["development"], description: "Edge Network", keywords: ["cdn", "dns"] },
  { id: "vercel", name: "Vercel", categories: ["development"], description: "Deploy & Preview", keywords: ["hosting", "nextjs"] },
  { id: "supabase", name: "Supabase", categories: ["development"], description: "Database & Auth", keywords: ["postgres", "backend"] },
  { id: "postgresql", name: "PostgreSQL", categories: ["development"], description: "Relational Data", keywords: ["sql", "database"] },
  { id: "mongodb", name: "MongoDB", categories: ["development"], description: "Document Store", keywords: ["nosql"] },
  { id: "redis", name: "Redis", categories: ["development"], description: "Caching Layer", keywords: ["cache", "queue"] },
  { id: "hubspot", name: "HubSpot", categories: ["crm", "marketing"], description: "CRM & Marketing Hub", keywords: ["crm", "leads"] },
  { id: "salesforce", name: "Salesforce", categories: ["crm"], description: "Enterprise CRM", keywords: ["sales", "pipeline"] },
  { id: "zapier", name: "Zapier", categories: ["productivity"], description: "Workflow Automation", keywords: ["automation", "zaps"] },
  { id: "n8n", name: "n8n", categories: ["productivity"], description: "Self-hosted Automations", keywords: ["workflows"] },
  { id: "figma", name: "Figma", categories: ["productivity"], description: "Design Handoff", keywords: ["design", "ui"] },
  { id: "linear", name: "Linear", categories: ["productivity"], description: "Issue Tracking", keywords: ["issues", "tasks"] },
  { id: "clickup", name: "ClickUp", categories: ["productivity"], description: "Project Management", keywords: ["tasks"] },
  { id: "trello", name: "Trello", categories: ["productivity"], description: "Kanban Boards", keywords: ["boards"] },
  { id: "asana", name: "Asana", categories: ["productivity"], description: "Team Workflows", keywords: ["projects"] },
  { id: "jira", name: "Jira", categories: ["productivity"], description: "Agile Delivery", keywords: ["sprints", "atlassian"] },
  { id: "calendly", name: "Calendly", categories: ["scheduling"], description: "Booking Links", keywords: ["scheduling", "meetings"] },
  { id: "twilio", name: "Twilio", categories: ["communication"], description: "SMS & Voice API", keywords: ["sms", "api"] },
  { id: "resend", name: "Resend", categories: ["communication"], description: "Transactional Email", keywords: ["email", "api"] },
  { id: "mailchimp", name: "Mailchimp", categories: ["marketing"], description: "Email Campaigns", keywords: ["newsletter"] },
  { id: "brevo", name: "Brevo", categories: ["marketing"], description: "Marketing Automation", keywords: ["sendinblue"] },
  { id: "intercom", name: "Intercom", categories: ["communication"], description: "Customer Messaging", keywords: ["support", "chat"] },
  { id: "airtable", name: "Airtable", categories: ["productivity"], description: "Flexible Databases", keywords: ["tables", "records"] },
  { id: "shopify", name: "Shopify", categories: ["payments"], description: "E-commerce Storefront", keywords: ["store", "commerce"] },
  { id: "woocommerce", name: "WooCommerce", categories: ["payments"], description: "WordPress Commerce", keywords: ["wordpress", "store"] },
];

export function filterIntegrations(input: {
  query: string;
  category: IntegrationCategory | "all";
}): Integration[] {
  const q = input.query.trim().toLowerCase();
  return INTEGRATIONS.filter((integration) => {
    const categoryMatch =
      input.category === "all" || integration.categories.includes(input.category);
    if (!categoryMatch) return false;
    if (!q) return true;
    return (
      integration.name.toLowerCase().includes(q) ||
      integration.id.includes(q) ||
      integration.description.toLowerCase().includes(q) ||
      integration.keywords?.some((keyword) => keyword.includes(q))
    );
  });
}
