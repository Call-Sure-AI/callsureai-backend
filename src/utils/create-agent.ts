import axios, { AxiosResponse } from "axios";

export type AgentType = "chatbot" | "support" | string;

export interface FileDescription {
  [filename: string]: string;
}

export interface CreateAgentRequest {
  name: string;
  type: AgentType;
  company_id: string;
  prompt: string;
  voice_id: string;
  files?: string[] | null;
  descriptions?: FileDescription | null;
}

export interface AgentResponse {
  id: string;
  name: string;
  type: string;
  company_id: string;
  prompt: string;
}

export interface DocumentsResponse {
  total: number;
  document_ids: string[];
  image_ids: string[];
}

export interface CreateAgentResponse {
  status: string;
  agent: AgentResponse;
  documents: DocumentsResponse;
}

export interface ApiError {
  detail: string;
}

/**
 * Creates an agent using the Create Agent API (S3 URLs only)
 *
 * @param baseUrl - The base URL of the API
 * @param data - The agent data to be submitted with S3 URLs
 * @returns Promise with the created agent response
 */
export async function createAgent(
  baseUrl: string,
  data: CreateAgentRequest,
): Promise<CreateAgentResponse> {
  const url = `${baseUrl}/api/v1/admin/agents`;

  // Set up headers for JSON request
  const headers: Record<string, string> = {
    "Content-Type": "multipart/form-data",
  };

  try {
    const response: AxiosResponse<CreateAgentResponse> = await axios.post(
      url,
      data,
      { headers },
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `API Error: ${error.response.status} - ${(error.response.data as ApiError).detail || error.message}`,
      );
    }
    throw new Error(
      `Failed to create agent: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
