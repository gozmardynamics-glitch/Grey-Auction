export type ProviderType = 'openai' | 'anthropic' | 'gemini';

export interface ProviderPreset {
  name: string;
  displayName: string;
  baseUrl: string;
  docs: string;
  tier: 'production' | 'development' | 'testing';
  providerType?: ProviderType;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  { name: 'openai', displayName: 'OpenAI', baseUrl: 'https://api.openai.com/v1', docs: 'https://platform.openai.com/docs', tier: 'production', providerType: 'openai' },
  { name: 'anthropic', displayName: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', docs: 'https://docs.anthropic.com', tier: 'production', providerType: 'anthropic' },
  { name: 'deepseek', displayName: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', docs: 'https://api-docs.deepseek.com', tier: 'production', providerType: 'openai' },
  { name: 'qwen', displayName: 'Qwen (Alibaba DashScope)', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', docs: 'https://help.aliyun.com/zh/model-studio', tier: 'production', providerType: 'openai' },
  { name: 'wan', displayName: 'Wan (Alibaba DashScope)', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', docs: 'https://help.aliyun.com/zh/model-studio/wan', tier: 'production', providerType: 'openai' },
  { name: 'poolside', displayName: 'Poolside', baseUrl: 'https://api.poolside.ai/v1', docs: 'https://docs.poolside.ai', tier: 'production', providerType: 'openai' },
  { name: 'zhipu', displayName: 'Zhipu GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', docs: 'https://open.bigmodel.cn/dev/api', tier: 'production' },
  { name: 'moonshot', displayName: 'Moonshot Kimi', baseUrl: 'https://api.moonshot.cn/v1', docs: 'https://platform.moonshot.cn/docs', tier: 'production' },
  { name: 'openrouter', displayName: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', docs: 'https://openrouter.ai/docs', tier: 'production' },
  { name: 'novita', displayName: 'Novita AI', baseUrl: 'https://api.novita.ai/v3/openai', docs: 'https://novita.ai/docs', tier: 'production' },
  { name: 'groq', displayName: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', docs: 'https://console.groq.com/docs', tier: 'production' },
  { name: 'mistral', displayName: 'Mistral', baseUrl: 'https://api.mistral.ai/v1', docs: 'https://docs.mistral.ai', tier: 'production' },
  { name: 'gemini', displayName: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', docs: 'https://ai.google.dev/docs', tier: 'production' },
  { name: 'nvidia', displayName: 'NVIDIA NIM', baseUrl: 'https://integrate.api.nvidia.com/v1', docs: 'https://docs.nvidia.com/nim', tier: 'production' },
  { name: 'minimax', displayName: 'Minimax', baseUrl: 'https://api.minimax.chat/v1', docs: 'https://platform.minimax.chat', tier: 'production' },
  { name: 'stepfun', displayName: 'StepFun', baseUrl: 'https://api.stepfun.com/v1', docs: 'https://platform.stepfun.com/docs', tier: 'production' },
  { name: 'ollama', displayName: 'Ollama (local Llama)', baseUrl: 'http://localhost:11434/v1', docs: 'https://ollama.com', tier: 'development' },
];
