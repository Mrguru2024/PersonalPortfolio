export interface CrmDashboardStats {
  totalContacts: number;
  totalAccounts: number;
  totalActiveLeads: number;
  leadsMissingData: number;
  proposalReadyCount?: number;
  followUpNeededCount?: number;
  sequenceReadyCount?: number;
  leadsByPipelineStage: { stage: string; count: number }[];
  topSources?: { source: string; count: number }[];
  topTags?: { tag: string; count: number }[];
  recentTasks: Array<{
    id: number;
    title: string;
    dueAt: string | null;
    priority: string | null;
    contactId: number;
    contact?: { name: string };
  }>;
  overdueTasks: Array<{
    id: number;
    title: string;
    dueAt: string | null;
    contact?: { name: string };
  }>;
  recentActivity: Array<{
    id: number;
    type: string;
    title: string;
    createdAt: string;
  }>;
  accountsNeedingResearch: number;
  discoveryWorkspacesIncomplete?: number;
  proposalPrepNeedingAttention?: number;
}
