import { AutomationFramework } from '../models/AutomationFramework';

/**
 * Result from AI analysis
 */
export interface AIAnalysisResult {
  recommendedSelector?: string;
  confidence: number;
  reasoning: string;
  playwrightLocator?: any; // PlaywrightLocator for Playwright framework
  alternativeSelectors?: string[];
  tokensUsed?: number;
}

/**
 * AI Service interface for element healing
 */
export interface AIService {
  /**
   * Analyze DOM to find element
   */
  analyzeDOM(
    html: string,
    description: string,
    originalSelector: string,
    framework?: AutomationFramework
  ): Promise<AIAnalysisResult>;

  /**
   * Analyze screenshot to find element
   */
  analyzeVisual(screenshot: Buffer, description: string): Promise<AIAnalysisResult>;

  /**
   * Select best matching element from multiple candidates
   */
  selectBestMatchingElement(elements: any[], description: string): Promise<any>;

  /**
   * Get provider name
   */
  getProviderName(): string;
}
