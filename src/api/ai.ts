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

export async function chatWithAi(token: string, prompt: string): Promise<AiHistory> {
  return apiRequest<AiHistory>('/api/Ai/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt }),
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
