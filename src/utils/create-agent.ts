import axios, { AxiosResponse } from "axios";

export type AgentType = "chatbot" | "support" | string;

export interface FileDescription {
  [filename: string]: string;
}

export interface CreateAgentRequest {
  id?: string;             // Added optional ID field
  name: string;
  type: AgentType;
  company_id: string;
  prompt: string;
  voice_id?: string;       // Made voice_id optional
  user_id?: string;        // Added optional user_id
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

  // Create form data object
  const formData = new FormData();
  
  // Add ID if it exists (important for preventing duplicates)
  if (data.id) {
    formData.append('id', data.id);
    console.log("Added ID to FastAPI request:", data.id);
  }
  
  // Add required fields
  formData.append('name', data.name);
  formData.append('type', data.type);
  formData.append('company_id', data.company_id);
  formData.append('prompt', data.prompt);
  
  // Add user_id if it exists
  if (data.user_id) {
    formData.append('user_id', data.user_id);
  }
  
  // Add optional fields if they exist
  if (data.voice_id) {
    formData.append('voice_id', data.voice_id);
  }
  
  if (data.files && data.files.length > 0) {
    formData.append('file_urls', JSON.stringify(data.files));
  }
  
  if (data.descriptions) {
    formData.append('descriptions', JSON.stringify(data.descriptions));
  }

  try {
    const response: AxiosResponse<CreateAgentResponse> = await axios.post(
      url,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `API Error: ${error.response.status} - ${(error.response.data as ApiError)?.detail || error.message}`,
      );
    }
    throw new Error(
      `Failed to create agent: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}