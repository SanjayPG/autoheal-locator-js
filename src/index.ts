/**
 * AutoHeal Locator for JavaScript/TypeScript
 *
 * AI-powered test automation framework that automatically heals broken locators
 * for Playwright and Selenium WebDriver
 */

// Main API
export { AutoHealLocator, AutoHealLocatorBuilder } from './core/AutoHealLocator';

// Adapters
export { PlaywrightAdapter } from './adapters/PlaywrightAdapter';
export { SeleniumAdapter } from './adapters/SeleniumAdapter';

// Core interfaces
export { WebAutomationAdapter } from './core/WebAutomationAdapter';
export { ElementLocator } from './core/ElementLocator';
export { AIService, AIAnalysisResult } from './core/AIService';
export { SelectorCache, CacheMetrics } from './core/SelectorCache';

// AI Services
export { GeminiAIService } from './ai/GeminiAIService';
export { OpenAIService } from './ai/OpenAIService';
export { AnthropicService } from './ai/AnthropicService';
export { DeepSeekService } from './ai/DeepSeekService';
export { GrokService } from './ai/GrokService';

// Cache implementations
export { MemoryCache } from './cache/MemoryCache';
export { FileCache } from './cache/FileCache';

// Configuration
export {
  AutoHealConfiguration,
  AIConfig,
  CacheConfig,
  PerformanceConfig,
  ReportingConfig,
  ExecutionStrategy,
  CacheType,
  loadConfiguration,
} from './config/AutoHealConfiguration';

// Reporting
export { AutoHealReporter } from './reporting/AutoHealReporter';

// Models
export { AutomationFramework } from './models/AutomationFramework';
export { LocatorStrategy } from './models/LocatorStrategy';
export { LocatorType, LocatorTypeDisplayNames } from './models/LocatorType';
export { Position } from './models/Position';
export { ElementFingerprint } from './models/ElementFingerprint';
export { ElementContext } from './models/ElementContext';
export { CachedSelector } from './models/CachedSelector';
export { LocatorRequest, LocatorOptions, defaultLocatorOptions } from './models/LocatorRequest';
export { LocatorResult } from './models/LocatorResult';
export { AIProvider, AIProviderConfig } from './models/AIProvider';
