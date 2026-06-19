import { apiRequest } from './http';

export interface AiHistory {
  id: string;
  userId: string;
  prompt: string;
  planSummary?: string;
  planData?: string;
  tokensUsed: number;
  createdAt: string;
}

export interface ChatRequest {
  prompt: string;
}

export async function chatWithAi(token: string, prompt: string, orgId?: string): Promise<AiHistory> {
  return apiRequest<AiHistory>('/api/Ai/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt, orgId: orgId || undefined }),
  });
}

export async function getAiHistory(token: string): Promise<AiHistory[]> {
  return apiRequest<AiHistory[]>('/api/Ai/history', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function syncProjectData(token: string, orgId: string): Promise<{ message: string; chunksCount: number }> {
  return apiRequest<{ message: string; chunksCount: number }>(`/api/Ai/sync-data/${orgId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export interface GeneratePlanRequest {
  projectGoal: string;
  description: string;
  category: string;
  difficulty: string;
  durationWeeks: number;
  teamSize: number;
  teamMembers: { name: string; targetSkills?: string | null; coreSkills?: string[] }[];
}

export async function generateProjectPlan(token: string, request: GeneratePlanRequest): Promise<{ planSummary: string }> {
  return apiRequest<{ planSummary: string }>('/api/Ai/generate-plan', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
}


