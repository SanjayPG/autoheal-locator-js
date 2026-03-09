/**
 * Supported AI providers for element healing
 */
export enum AIProvider {
  GOOGLE_GEMINI = 'GOOGLE_GEMINI',
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  DEEPSEEK = 'DEEPSEEK',
  GROK = 'GROK',
  GROQ = 'GROQ',
  LOCAL = 'LOCAL',
}

/**
 * AI provider configuration
 */
export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  timeout?: number;
  maxRetries?: number;

  // LOCAL provider options
  baseUrl?: string;
  apiPath?: string;
  format?: 'openai' | 'ollama' | 'custom';
  headers?: Record<string, string>;
  temperature?: number;
  maxTokens?: number;
}
