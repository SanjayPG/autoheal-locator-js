import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { AIProvider } from '../models/AIProvider';

dotenv.config();

/**
 * Execution strategy for element healing
 *
 * Determines the order and approach for AI-powered element location:
 *
 * - **SMART_SEQUENTIAL** (Default):
 *   1. Try DOM analysis first (fast & cost-effective)
 *   2. If DOM fails to find element → Automatically fallback to Visual analysis
 *   3. Best for most use cases (balances speed, cost, and reliability)
 *
 * - **VISUAL_FIRST**:
 *   1. Try Visual analysis first (better for complex/dynamic UIs)
 *   2. If Visual fails to find element → Automatically fallback to DOM analysis
 *   3. Higher cost but better for visually-driven element location
 *
 * - **DOM_ONLY**:
 *   1. Only use DOM analysis (no visual fallback)
 *   2. Fastest and cheapest option
 *   3. Use when elements are reliably accessible via DOM
 *
 * - **PARALLEL**:
 *   1. Run DOM and Visual analysis concurrently (future implementation)
 *   2. Currently uses VISUAL analysis only
 *   3. Highest cost but fastest when both methods are needed
 *
 * - **SEQUENTIAL**:
 *   1. Legacy/deprecated - same as SMART_SEQUENTIAL
 *   2. Use SMART_SEQUENTIAL instead
 */
export enum ExecutionStrategy {
  DOM_ONLY = 'DOM_ONLY',
  SMART_SEQUENTIAL = 'SMART_SEQUENTIAL',
  PARALLEL = 'PARALLEL',
  VISUAL_FIRST = 'VISUAL_FIRST',
  SEQUENTIAL = 'SEQUENTIAL',
}

/**
 * Cache type configuration
 */
export enum CacheType {
  MEMORY = 'MEMORY',
  PERSISTENT_FILE = 'PERSISTENT_FILE',
}

/**
 * AI Configuration
 */
export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  timeout: number;
  maxRetries: number;
  visualAnalysisEnabled: boolean;
}

/**
 * Cache Configuration
 */
export interface CacheConfig {
  type: CacheType;
  maxSize: number;
  expireAfterWriteMs: number;
  cacheDirectory?: string;
}

/**
 * Performance Configuration
 */
export interface PerformanceConfig {
  executionStrategy: ExecutionStrategy;
  threadPoolSize: number;
  elementTimeoutMs: number;
  enableMetrics: boolean;
}

/**
 * Reporting Configuration
 */
export interface ReportingConfig {
  enabled: boolean;
  generateHTML: boolean;
  generateJSON: boolean;
  generateText: boolean;
  consoleLogging: boolean;
  outputDirectory: string;
}

/**
 * Complete AutoHeal Configuration
 */
export interface AutoHealConfiguration {
  ai: AIConfig;
  cache: CacheConfig;
  performance: PerformanceConfig;
  reporting: ReportingConfig;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: AutoHealConfiguration = {
  ai: {
    provider: AIProvider.GOOGLE_GEMINI,
    model: 'gemini-2.0-flash-exp',
    timeout: 30000,
    maxRetries: 3,
    visualAnalysisEnabled: true,
  },
  cache: {
    type: CacheType.PERSISTENT_FILE,
    maxSize: 10000,
    expireAfterWriteMs: 24 * 60 * 60 * 1000, // 24 hours
    cacheDirectory: './autoheal-cache',
  },
  performance: {
    executionStrategy: ExecutionStrategy.SMART_SEQUENTIAL,
    threadPoolSize: 4,
    elementTimeoutMs: 30000,
    enableMetrics: true,
  },
  reporting: {
    enabled: true,
    generateHTML: true,
    generateJSON: true,
    generateText: false,
    consoleLogging: true,
    outputDirectory: './autoheal-reports',
  },
};

/**
 * Load configuration from environment variables and files
 */
export function loadConfiguration(customConfig?: Partial<AutoHealConfiguration>): AutoHealConfiguration {
  const envConfig = loadFromEnvironment();
  const fileConfig = loadFromConfigFile();

  // Merge: custom > file > env > defaults
  return deepMerge(DEFAULT_CONFIG, envConfig, fileConfig, customConfig || {});
}

/**
 * Load configuration from environment variables
 */
function loadFromEnvironment(): Partial<AutoHealConfiguration> {
  const config: Partial<AutoHealConfiguration> = {};

  // AI Configuration
  if (process.env.AUTOHEAL_AI_PROVIDER) {
    config.ai = {
      provider: process.env.AUTOHEAL_AI_PROVIDER as AIProvider,
      apiKey: getAPIKeyFromEnv(process.env.AUTOHEAL_AI_PROVIDER as AIProvider),
      model: process.env.AUTOHEAL_AI_MODEL,
      timeout: parseInt(process.env.AUTOHEAL_AI_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.AUTOHEAL_AI_MAX_RETRIES || '3'),
      visualAnalysisEnabled: process.env.AUTOHEAL_AI_VISUAL_ENABLED !== 'false',
    };
  }

  // Cache Configuration
  if (process.env.AUTOHEAL_CACHE_TYPE) {
    config.cache = {
      type: process.env.AUTOHEAL_CACHE_TYPE as CacheType,
      maxSize: parseInt(process.env.AUTOHEAL_CACHE_MAX_SIZE || '10000'),
      expireAfterWriteMs: parseInt(process.env.AUTOHEAL_CACHE_EXPIRE_AFTER_WRITE || '86400000'),
      cacheDirectory: process.env.AUTOHEAL_CACHE_DIRECTORY,
    };
  }

  // Performance Configuration
  if (process.env.AUTOHEAL_EXECUTION_STRATEGY) {
    config.performance = {
      executionStrategy: process.env.AUTOHEAL_EXECUTION_STRATEGY as ExecutionStrategy,
      threadPoolSize: parseInt(process.env.AUTOHEAL_THREAD_POOL_SIZE || '4'),
      elementTimeoutMs: parseInt(process.env.AUTOHEAL_ELEMENT_TIMEOUT || '30000'),
      enableMetrics: process.env.AUTOHEAL_ENABLE_METRICS !== 'false',
    };
  }

  // Reporting Configuration
  if (process.env.AUTOHEAL_REPORTING_ENABLED !== undefined) {
    config.reporting = {
      enabled: process.env.AUTOHEAL_REPORTING_ENABLED === 'true',
      generateHTML: process.env.AUTOHEAL_REPORTING_HTML !== 'false',
      generateJSON: process.env.AUTOHEAL_REPORTING_JSON !== 'false',
      generateText: process.env.AUTOHEAL_REPORTING_TEXT === 'true',
      consoleLogging: process.env.AUTOHEAL_REPORTING_CONSOLE !== 'false',
      outputDirectory: process.env.AUTOHEAL_REPORTING_OUTPUT_DIR || './autoheal-reports',
    };
  }

  return config;
}

/**
 * Get API key from environment based on provider
 */
function getAPIKeyFromEnv(provider: AIProvider): string | undefined {
  switch (provider) {
    case AIProvider.GOOGLE_GEMINI:
      return process.env.GEMINI_API_KEY;
    case AIProvider.OPENAI:
      return process.env.OPENAI_API_KEY;
    case AIProvider.ANTHROPIC:
      return process.env.ANTHROPIC_API_KEY;
    case AIProvider.DEEPSEEK:
      return process.env.DEEPSEEK_API_KEY;
    case AIProvider.GROK:
      return process.env.GROK_API_KEY;
    case AIProvider.GROQ:
      return process.env.GROQ_API_KEY;
    default:
      return undefined;
  }
}

/**
 * Load configuration from .autohealrc.json file
 */
function loadFromConfigFile(): Partial<AutoHealConfiguration> {
  const configPaths = [
    path.join(process.cwd(), '.autohealrc.json'),
    path.join(process.cwd(), 'autoheal.config.json'),
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(fileContent);
      } catch (error) {
        console.warn(`Failed to load config from ${configPath}:`, error);
      }
    }
  }

  return {};
}

/**
 * Deep merge configuration objects
 */
function deepMerge(...objects: any[]): any {
  return objects.reduce((prev, obj) => {
    if (!obj) return prev;

    Object.keys(obj).forEach((key) => {
      const prevValue = prev[key];
      const objValue = obj[key];

      if (Array.isArray(prevValue) && Array.isArray(objValue)) {
        prev[key] = objValue;
      } else if (typeof prevValue === 'object' && typeof objValue === 'object') {
        prev[key] = deepMerge(prevValue, objValue);
      } else if (objValue !== undefined) {
        prev[key] = objValue;
      }
    });

    return prev;
  }, {});
}
