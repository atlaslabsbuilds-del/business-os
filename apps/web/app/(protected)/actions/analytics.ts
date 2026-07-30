"use server";
import { getUser } from "@repo/auth/server";
import { getMembershipRole } from "@repo/database/workspace";
import { generateExecutiveReport, getExecutiveAnalytics } from "@repo/database/analytics";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
export type AnalyticsActionResult<T>={ok:true;data:T}|{ok:false;error:string};
async function ctx(){const u=await getUser();if(!u)throw new Error("Unauthorized");const c=await resolveActiveWorkspace();if(!c)throw new Error("Workspace required");const r=await getMembershipRole(c.active.workspace.id,u.id);if(!r)throw new Error("Forbidden");return{userId:u.id,workspaceId:c.active.workspace.id};}
export async function getAnalyticsModuleData(){const c=await ctx();return getExecutiveAnalytics({workspaceId:c.workspaceId});}
export async function generateExecutiveReportAction():Promise<AnalyticsActionResult<{id:string}>>{try{const c=await ctx();const r=await generateExecutiveReport({workspaceId:c.workspaceId,userId:c.userId});return{ok:true,data:{id:r.id}}}catch(e){return{ok:false,error:e instanceof Error?e.message:"Failed to generate report"}}}
