import {
  getContact,
  getDashboardSnapshot,
  listContacts,
} from "@repo/database";
import type {
  KairosSelectedRecord,
  WorkspaceMembership,
} from "@repo/types";

export type KairosContextEngineInput = {
  userId: string;
  userEmail: string | null;
  workspace: WorkspaceMembership;
  memberships: WorkspaceMembership[];
  currentRoute?: string;
  selectedRecords?: KairosSelectedRecord[];
};

export type KairosContextSnapshot = {
  currentUser: {
    id: string;
    email: string | null;
    role: string;
  };
  workspace: {
    id: string;
    name: string;
    role: string;
    memberCount: number;
  };
  customers: Array<{
    id: string;
    name: string;
    email: string | null;
    lifecycleStage: string;
    updatedAt: string;
  }>;
  deals: Array<{
    id: string;
    title: string;
    amount: number;
    stage: string;
    probability: number;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    priority: string;
    isRead: boolean;
  }>;
  calendar: {
    upcoming: Array<{
      id: string;
      title: string;
      startsAt: string;
      actionUrl: string;
    }>;
    today: Array<{
      id: string;
      title: string;
      startsAt: string;
      actionUrl: string;
    }>;
  };
  crm: {
    contacts: number;
    companies: number;
    leads: number;
    openDeals: number;
    pipelineValue: number;
    wonRevenue: number;
  };
  currentRoute?: string;
  selectedRecords: KairosSelectedRecord[];
  recentActivity: Array<{
    id: string;
    module: string;
    title: string;
    body: string | null;
    createdAt: string;
  }>;
};

export async function buildKairosContext(
  input: KairosContextEngineInput,
): Promise<KairosContextSnapshot> {
  const workspaceId = input.workspace.workspace.id;
  const snapshotPromise = getDashboardSnapshot({
    workspaceId,
    userId: input.userId,
    membershipCount: input.memberships.length,
    role: input.workspace.role,
    workspaceName: input.workspace.workspace.name,
  });
  const customersPromise = listContacts({ workspaceId, limit: 25 });
  const selectedCustomerId = input.selectedRecords?.find(
    (record) => record.type === "customer",
  )?.id;
  const selectedCustomerPromise = selectedCustomerId
    ? getContact({ workspaceId, id: selectedCustomerId })
    : Promise.resolve(null);

  const [snapshot, customers, selectedCustomer] = await Promise.all([
    snapshotPromise,
    customersPromise,
    selectedCustomerPromise,
  ]);

  const customerRows = selectedCustomer
    ? [selectedCustomer, ...customers.filter((customer) => customer.id !== selectedCustomer.id)]
    : customers;

  return {
    currentUser: {
      id: input.userId,
      email: input.userEmail,
      role: input.workspace.role,
    },
    workspace: {
      id: workspaceId,
      name: input.workspace.workspace.name,
      role: input.workspace.role,
      memberCount: snapshot.workspace.members,
    },
    customers: customerRows.slice(0, 25).map((customer) => ({
      id: customer.id,
      name: [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Unnamed customer",
      email: customer.email,
      lifecycleStage: customer.lifecycleStage,
      updatedAt: customer.updatedAt,
    })),
    deals: snapshot.deals,
    notifications: snapshot.notifications.slice(0, 12).map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body ?? "",
      priority: notification.priority,
      isRead: notification.isRead,
    })),
    calendar: {
      upcoming: snapshot.events.slice(0, 10),
      today: snapshot.agenda
        .filter((item) => item.kind === "event")
        .slice(0, 10)
        .map((item) => ({
          id: item.id,
          title: item.title,
          startsAt: item.at ?? "",
          actionUrl: item.href,
        })),
    },
    crm: {
      contacts: snapshot.crm.contacts,
      companies: snapshot.crm.companies,
      leads: snapshot.kpis.leads,
      openDeals: snapshot.crm.openDeals,
      pipelineValue: snapshot.crm.pipelineValue,
      wonRevenue: snapshot.crm.wonValue,
    },
    currentRoute: input.currentRoute,
    selectedRecords: input.selectedRecords ?? [],
    recentActivity: snapshot.activity.slice(0, 12).map((activity) => ({
      id: activity.id,
      module: activity.module,
      title: activity.title,
      body: activity.body,
      createdAt: activity.createdAt,
    })),
  };
}

export function serializeKairosContext(context: KairosContextSnapshot): string {
  return JSON.stringify(context);
}
