import { apiRequest } from './http';
import { getAuthToken } from '../components/dashboard/utils/dashboardUtils';

export interface CreateInvitationRequest {
  email: string;
  targetType: string;
  targetId: string;
  role: string;
}

export interface VerifyInvitationResponse {
  email: string;
  targetType: string;
  targetId: string;
  role: string;
  orgId?: string;
}

export const createInvitation = async (data: CreateInvitationRequest) => {
  return await apiRequest<any>('/api/invitations', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
};

export const verifyInvitation = async (token: string): Promise<VerifyInvitationResponse> => {
  return await apiRequest<VerifyInvitationResponse>(`/api/invitations/verify?token=${token}`, {
    method: 'GET',
  });
};

export const acceptInvitation = async (token: string) => {
  return await apiRequest<any>('/api/invitations/accept', {
    method: 'POST',
    body: JSON.stringify({ token }),
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
};
