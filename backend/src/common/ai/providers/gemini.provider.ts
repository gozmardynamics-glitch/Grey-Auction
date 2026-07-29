import { AIProvider, AIProviderConfig, ChatCompletionRequest, ChatCompletionResponse } from '../interfaces/ai-provider.interface';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private config: AIProviderConfig;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.baseUrl = (config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const systemMsg = req.messages.find(m => m.role === 'system');
    const chatMsgs = req.messages.filter(m => m.role !== 'system');

    const contents = chatMsgs.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: req.temperature ?? 0.7,
        maxOutputTokens: req.maxTokens ?? 2048,
      },
    };
    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    const url = `${this.baseUrl}/models/${req.model}:generateContent?key=${this.config.apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.headers || {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => 'Unknown error');
      throw new Error(`[gemini] ${resp.status} ${resp.statusText}: ${errText}`);
    }

    const data = await resp.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
    const usage = data?.usageMetadata;

    return {
      content: text,
      model: req.model,
      usage: usage ? {
        promptTokens: usage.promptTokenCount || 0,
        completionTokens: usage.candidatesTokenCount || 0,
      } : undefined,
    };
  }

  async chatJSON<T = Record<string, unknown>>(req: Omit<ChatCompletionRequest, 'responseFormat'>): Promise<T> {
    const jsonReq: ChatCompletionRequest = {
      ...req,
      messages: [
        ...req.messages,
        { role: 'user' as const, content: 'Respond ONLY with valid JSON. Do not include markdown formatting.' },
      ],
    };
    const result = await this.chat(jsonReq);
    try {
      const cleaned = result.content.replace(/```json\n?|```/g, '').trim();
      return JSON.parse(cleaned) as T;
    } catch {
      return {} as T;
    }
  }

  async *chatStream(req: ChatCompletionRequest): AsyncGenerator<string, void, unknown> {
    const result = await this.chat(req);
    yield result.content;
  }

  async listModels(): Promise<string[]> {
    try {
      const url = `${this.baseUrl}/models?key=${this.config.apiKey}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!resp.ok) return [];
      const data = await resp.json() as any;
      return (data?.models || []).map((m: any) => m.name?.replace('models/', '')).filter(Boolean) as string[];
    } catch {
      return [];
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/models/gemini-2.0-flash:generateContent?key=${this.config.apiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(this.config.headers || {}) },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'ping' }] }],
          generationConfig: { maxOutputTokens: 1 },
        }),
        signal: AbortSignal.timeout(10000),
      });
      return resp.ok;
    } catch {
      return false;
    }
  }
}
