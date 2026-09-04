import apiClient from './client';
import type { Archive } from './archives';

export type PlatformRole = 'researcher' | 'depositor' | 'cataloger' | 'reviewer' | 'institution_admin' | 'system_admin' | 'sovereignty_custodian';
export type WorkflowAction = 'submit' | 'start_cataloging' | 'request_review' | 'approve' | 'return_changes' | 'publish' | 'unpublish';

export interface RoleAssignment {
  id: string;
  role: PlatformRole;
  institutionId?: string;
}

export interface GovernanceUser {
  id: string;
  fullName: string;
  email: string;
  institutionId?: string;
  accountStatus: string;
  roleAssignments: RoleAssignment[];
}

export interface AccessRequest {
  id: string;
  reason: string;
  intendedUse?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  decisionNote?: string;
  expiresAt?: string;
  createdAt: string;
  requester?: { id: string; fullName: string; email: string };
  archiveRecord: Pick<Archive, 'id' | 'titleAr' | 'titleEn' | 'accessLevel'>;
}

export const governanceApi = {
  users: async (institutionId?: string): Promise<GovernanceUser[]> =>
    (await apiClient.get('/governance/users', { params: { institution_id: institutionId } })).data,
  assignRole: async (data: { userId: string; role: PlatformRole; institutionId?: string }) =>
    (await apiClient.post('/governance/roles', data)).data,
  revokeRole: async (id: string) => (await apiClient.patch(`/governance/roles/${id}/revoke`)).data,
  requestAccess: async (archiveId: string, data: { reason: string; intendedUse?: string }): Promise<AccessRequest> =>
    (await apiClient.post(`/archives/${archiveId}/access-requests`, data)).data,
  myRequests: async (): Promise<AccessRequest[]> => (await apiClient.get('/access-requests/mine')).data,
  reviewRequests: async (): Promise<AccessRequest[]> => (await apiClient.get('/access-requests/review')).data,
  decideRequest: async (id: string, data: { decision: 'approved' | 'rejected'; note?: string; grantHours?: number }) =>
    (await apiClient.post(`/access-requests/${id}/decision`, data)).data,
  workflowQueue: async (): Promise<Archive[]> => (await apiClient.get('/workflow/queue')).data,
  transition: async (archiveId: string, action: WorkflowAction, note?: string): Promise<Archive> =>
    (await apiClient.post(`/archives/${archiveId}/workflow`, { action, note })).data,
};
