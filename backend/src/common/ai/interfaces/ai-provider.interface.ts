export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  responseFormat?: 'json_object' | 'text';
}

export interface ChatCompletionResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface AIProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  headers?: Record<string, string>;
}

export interface AIProvider {
  name: string;

  chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  chatJSON<T = Record<string, unknown>>(req: Omit<ChatCompletionRequest, 'responseFormat'>): Promise<T>;
  chatStream(req: ChatCompletionRequest): AsyncGenerator<string, void, unknown>;
  listModels(): Promise<string[]>;
  healthCheck(): Promise<boolean>;
}
