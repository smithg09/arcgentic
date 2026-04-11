// ─── Model Settings Types ───

export type ProviderId = 'openai' | 'anthropic' | 'google' | 'openrouter' | 'ollama' | 'lmstudio'

export interface ModelConfig {
  provider: ProviderId
  model: string
  apiKey: string
  baseUrl: string
  temperature: number
  topP: number
}

export interface ProviderOption {
  id: ProviderId
  name: string
  description: string
  models: string[]
  requiresApiKey: boolean
  requiresBaseUrl: boolean
  defaultBaseUrl?: string
  envConfigured?: boolean
}

export const PROVIDERS: ProviderOption[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4.1, GPT-4o and more',
    models: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o', 'gpt-4o-mini', 'o3-mini'],
    requiresApiKey: true,
    requiresBaseUrl: false,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude Sonnet, Opus, Haiku',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-3-5-20241022'],
    requiresApiKey: true,
    requiresBaseUrl: false,
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini 2.5 Flash, Pro & more',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    requiresApiKey: true,
    requiresBaseUrl: false,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access 200+ models via one API',
    models: ['openai/gpt-4o', 'anthropic/claude-sonnet-4-20250514', 'google/gemini-2.5-flash', 'meta-llama/llama-3.1-70b-instruct'],
    requiresApiKey: true,
    requiresBaseUrl: true,
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Run models locally',
    models: ['llama3', 'llama3.1', 'mistral', 'codellama', 'phi3', 'gemma2'],
    requiresApiKey: false,
    requiresBaseUrl: true,
    defaultBaseUrl: 'http://localhost:11434',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    description: 'Local models via OpenAI-compatible API',
    models: ['llama3', 'mistral', 'phi3', 'gemma2', 'codellama'],
    requiresApiKey: false,
    requiresBaseUrl: true,
    defaultBaseUrl: 'http://localhost:1234/v1',
  },
]

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKey: '',
  baseUrl: '',
  temperature: 0.7,
  topP: 1.0,
}
