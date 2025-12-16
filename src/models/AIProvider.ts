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
  baseUrl?: string;
}
