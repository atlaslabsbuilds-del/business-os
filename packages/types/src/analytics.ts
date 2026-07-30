import { z } from "zod";

export const analyticsWidgetTypeSchema = z.enum(["metric", "line", "bar", "area", "pie", "heatmap", "table"]);
export type AnalyticsWidgetType = z.infer<typeof analyticsWidgetTypeSchema>;
export type AnalyticsDashboard = { id: string; workspaceId: string; createdBy: string; name: string; description: string | null; isDefault: boolean; layout: Array<Record<string, unknown>>; createdAt: string; updatedAt: string };
export type AnalyticsWidget = { id: string; workspaceId: string; dashboardId: string; createdBy: string; title: string; metricKey: string; widgetType: AnalyticsWidgetType; position: number; config: Record<string, unknown>; createdAt: string; updatedAt: string };
export type AnalyticsReport = { id: string; workspaceId: string; createdBy: string; name: string; reportType: string; filters: Record<string, unknown>; data: Record<string, unknown>; generatedAt: string; createdAt: string; updatedAt: string };
export type SavedAnalyticsReport = { id: string; workspaceId: string; reportId: string | null; createdBy: string; name: string; schedule: string | null; recipients: string[]; lastSentAt: string | null; createdAt: string; updatedAt: string };
export type AiInsight = { id: string; workspaceId: string; createdBy: string | null; title: string; body: string; category: string; severity: "info" | "success" | "warning" | "critical"; score: number | null; actionUrl: string | null; createdAt: string; updatedAt: string };
export type AnalyticsForecast = { id: string; workspaceId: string; createdBy: string; metricKey: string; periodStart: string; periodEnd: string; predictedValue: number; confidence: number; methodology: string | null; createdAt: string; updatedAt: string };
export type ExecutiveAnalytics = { revenue: number; expenses: number; profit: number; cashFlow: number; activeCustomers: number; leads: number; conversionRate: number; projects: number; tasksCompleted: number; teamProductivity: number; aiScore: number; businessHealthScore: number; monthly: Array<{ month: string; revenue: number; expenses: number; profit: number }>; funnel: Array<{ stage: string; count: number }>; insights: AiInsight[]; forecast: AnalyticsForecast | null };
export const createAnalyticsDashboardSchema = z.object({ name: z.string().trim().min(1).max(160), description: z.string().trim().max(1000).optional().nullable() });
export const createAnalyticsReportSchema = z.object({ name: z.string().trim().min(1).max(160), reportType: z.string().max(80).optional() });
