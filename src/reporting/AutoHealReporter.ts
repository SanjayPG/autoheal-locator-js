import * as fs from 'fs';
import * as path from 'path';
import { LocatorStrategy } from '../models/LocatorStrategy';

/**
 * AutoHeal Reporter - Tracks and reports all selector usage and healing strategies
 *
 * Generates comprehensive HTML, JSON, and Text reports similar to the Java implementation
 */
export class AutoHealReporter {
  private reports: SelectorReport[] = [];
  private testRunId: string;
  private startTime: Date;

  // AI Configuration details
  private aiProvider: string;
  private aiModel: string;
  private apiEndpoint: string;
  private domTemperature: number;
  private visualTemperature: number;
  private domMaxTokens: number;
  private visualMaxTokens: number;
  private maxRetries: number;

  constructor(aiConfig?: any) {
    this.testRunId = `AutoHeal_${this.formatDateTime(new Date())}`;
    this.startTime = new Date();

    // Default values or from configuration
    this.aiProvider = aiConfig?.provider || 'Gemini';
    this.aiModel = aiConfig?.model || 'gemini-2.0-flash';
    this.apiEndpoint = this.getApiEndpointForProvider(aiConfig?.provider);
    this.domTemperature = aiConfig?.domTemperature || 0.1;
    this.visualTemperature = aiConfig?.visualTemperature || 0.0;
    this.domMaxTokens = aiConfig?.domMaxTokens || 500;
    this.visualMaxTokens = aiConfig?.visualMaxTokens || 1000;
    this.maxRetries = aiConfig?.maxRetries || 3;
  }

  /**
   * Get the API endpoint URL for a given provider
   */
  private getApiEndpointForProvider(provider?: string): string {
    const providerUpper = (provider || 'GOOGLE_GEMINI').toUpperCase();

    switch (providerUpper) {
      case 'GOOGLE_GEMINI':
      case 'GEMINI':
        return 'https://generativelanguage.googleapis.com/v1beta/models';
      case 'OPENAI':
        return 'https://api.openai.com/v1/chat/completions';
      case 'ANTHROPIC':
      case 'CLAUDE':
        return 'https://api.anthropic.com/v1/messages';
      case 'DEEPSEEK':
        return 'https://api.deepseek.com/v1/chat/completions';
      case 'GROK':
        return 'https://api.x.ai/v1/chat/completions';
      case 'GROQ':
        return 'https://api.groq.com/openai/v1/chat/completions';
      case 'LOCAL':
        return 'http://localhost:11434/api/generate';
      default:
        return 'https://generativelanguage.googleapis.com/v1beta/models';
    }
  }

  /**
   * Record a selector usage event
   */
  recordSelectorUsage(
    originalSelector: string,
    description: string,
    strategy: LocatorStrategy,
    executionTimeMs: number,
    success: boolean,
    actualSelector: string,
    elementDetails: string,
    reasoning: string,
    tokensUsed: number = 0
  ): void {
    const report: SelectorReport = {
      originalSelector,
      description,
      strategy,
      executionTimeMs,
      success,
      actualSelector,
      elementDetails,
      reasoning,
      tokensUsed,
      timestamp: new Date(),
      aiProvider: this.aiProvider,
      aiModel: this.aiModel,
      apiEndpoint: this.apiEndpoint,
      maxTokens: strategy === LocatorStrategy.DOM_ANALYSIS ? this.domMaxTokens : this.visualMaxTokens,
      temperature: strategy === LocatorStrategy.DOM_ANALYSIS ? this.domTemperature : this.visualTemperature,
      retryCount: this.maxRetries,
      promptType: strategy === LocatorStrategy.DOM_ANALYSIS ? 'DOM Analysis' : 'Visual Analysis',
      promptTokens: 0,
      completionTokens: 0,
    };

    this.reports.push(report);
    this.logToConsole(report);
  }

  private logToConsole(report: SelectorReport): void {
    const status = report.success ? 'SUCCESS' : 'FAILED';
    const strategyName = this.getStrategyShortName(report.strategy);
    const tokenInfo = report.tokensUsed > 0 &&
      (report.strategy === LocatorStrategy.DOM_ANALYSIS || report.strategy === LocatorStrategy.VISUAL_ANALYSIS)
      ? ` [${report.tokensUsed} tokens]`
      : '';

    console.log(
      `[${status}] [${strategyName}] [${report.executionTimeMs}ms]${tokenInfo} ${report.originalSelector} → ${
        report.success ? report.actualSelector : 'FAILED'
      }`
    );

    if (report.originalSelector !== report.actualSelector && report.success) {
      console.log(`   [HEALED] ${report.reasoning}`);
    }
  }

  private getStrategyShortName(strategy: LocatorStrategy): string {
    switch (strategy) {
      case LocatorStrategy.ORIGINAL_SELECTOR:
        return 'ORIGINAL';
      case LocatorStrategy.DOM_ANALYSIS:
        return 'DOM-AI';
      case LocatorStrategy.VISUAL_ANALYSIS:
        return 'VISUAL-AI';
      case LocatorStrategy.CACHED:
        return 'CACHE';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Generate comprehensive HTML report
   */
  generateHTMLReport(outputDir: string = './autoheal-reports'): string {
    this.ensureDirectoryExists(outputDir);
    const filename = path.join(outputDir, `${this.testRunId}_Report.html`);
    const html = this.generateHTMLContent();

    fs.writeFileSync(filename, html, 'utf8');
    console.log(`📊 HTML Report generated: ${filename}`);

    return filename;
  }

  /**
   * Generate JSON report for programmatic consumption
   */
  generateJSONReport(outputDir: string = './autoheal-reports'): string {
    this.ensureDirectoryExists(outputDir);
    const filename = path.join(outputDir, `${this.testRunId}_Report.json`);

    const stats = this.calculateStatistics();
    const hasAI = this.reports.some(
      r => r.strategy === LocatorStrategy.DOM_ANALYSIS || r.strategy === LocatorStrategy.VISUAL_ANALYSIS
    );

    const jsonReport = {
      reportMetadata: {
        generatedAt: new Date().toISOString(),
        testRunId: this.testRunId,
        startTime: this.startTime.toISOString(),
        endTime: new Date().toISOString(),
        duration: this.formatDuration(Date.now() - this.startTime.getTime()),
        totalSelectors: this.reports.length,
      },
      summary: {
        totalElements: this.reports.length,
        successfulHealing: stats.successful,
        failedHealing: this.reports.length - stats.successful,
        healingSuccessRate: ((stats.successful / this.reports.length) * 100).toFixed(1),
        originalSelectorCount: stats.originalStrategy,
        domHealedCount: stats.domHealed,
        visualHealedCount: stats.visualHealed,
        cachedCount: stats.cached,
      },
      aiImplementation: hasAI ? {
        configuration: {
          provider: this.aiProvider,
          model: this.aiModel,
          apiEndpoint: this.apiEndpoint,
          maxTokensDOM: this.domMaxTokens,
          maxTokensVisual: this.visualMaxTokens,
          temperatureDOM: this.domTemperature,
          temperatureVisual: this.visualTemperature,
          maxRetries: this.maxRetries,
        },
        usage: {
          domAnalysisRequests: stats.domHealed,
          visualAnalysisRequests: stats.visualHealed,
          totalTokens: stats.totalTokens,
          domTokens: stats.domTokens,
          visualTokens: stats.visualTokens,
          estimatedCostUSD: this.estimateCost(stats.totalTokens),
        },
      } : undefined,
      healingActivities: this.reports.map(r => ({
        originalSelector: r.originalSelector,
        actualSelector: r.actualSelector,
        description: r.description,
        strategy: r.strategy,
        executionTimeMs: r.executionTimeMs,
        success: r.success,
        elementDetails: r.elementDetails,
        reasoning: r.reasoning,
        tokensUsed: r.tokensUsed,
        timestamp: r.timestamp.toISOString(),
        aiImplementation: (r.strategy === LocatorStrategy.DOM_ANALYSIS || r.strategy === LocatorStrategy.VISUAL_ANALYSIS) ? {
          provider: r.aiProvider,
          model: r.aiModel,
          promptType: r.promptType,
          temperature: r.temperature,
          maxTokens: r.maxTokens,
        } : undefined,
      })),
    };

    fs.writeFileSync(filename, JSON.stringify(jsonReport, null, 2), 'utf8');
    console.log(`📊 JSON Report generated: ${filename}`);

    return filename;
  }

  /**
   * Generate text report for easy reading
   */
  generateTextReport(outputDir: string = './autoheal-reports'): string {
    this.ensureDirectoryExists(outputDir);
    const filename = path.join(outputDir, `${this.testRunId}_Report.txt`);
    const text = this.generateTextContent();

    fs.writeFileSync(filename, text, 'utf8');
    console.log(`📊 Text Report generated: ${filename}`);

    return filename;
  }

  /**
   * Print summary to console
   */
  printSummary(): void {
    const stats = this.calculateStatistics();

    console.log('\n' + '='.repeat(60));
    console.log('AUTOHEAL TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(
      `Total: ${this.reports.length} | Success: ${stats.successful} | Failed: ${
        this.reports.length - stats.successful
      }`
    );
    console.log(
      `Original: ${stats.originalStrategy} | DOM Healed: ${stats.domHealed} | Visual: ${stats.visualHealed} | Cached: ${stats.cached}`
    );
    if (stats.totalTokens > 0) {
      console.log(
        `Token Usage - Total: ${stats.totalTokens} | DOM: ${stats.domTokens} | Visual: ${stats.visualTokens}`
      );
      console.log(`Estimated Cost: $${this.estimateCost(stats.totalTokens)}`);
    }
    console.log('='.repeat(60));
  }

  private generateHTMLContent(): string {
    const stats = this.calculateStatistics();
    const hasAI = this.reports.some(
      r => r.strategy === LocatorStrategy.DOM_ANALYSIS || r.strategy === LocatorStrategy.VISUAL_ANALYSIS
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AutoHeal Test Report - ${this.testRunId}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-box { background: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; color: #2980b9; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #34495e; color: white; font-weight: 600; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .original { background-color: #d5edd0 !important; }
        .dom-healed { background-color: #fff2cc !important; }
        .visual-healed { background-color: #ffe6e6 !important; }
        .cached { background-color: #e1f5fe !important; }
        .failed { background-color: #ffebee !important; }
        .success { color: #27ae60; font-weight: bold; }
        .failure { color: #e74c3c; font-weight: bold; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; }
        .filter-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db; }
        .filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0; }
        .filter-select, .search-box { width: 100%; padding: 8px 12px; border: 2px solid #bdc3c7; border-radius: 4px; }
        .filter-stats { text-align: center; margin: 15px 0; padding: 10px; background: #ecf0f1; border-radius: 4px; }
        .reset-btn { background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: 600; }
        .reset-btn:hover { background: #c0392b; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 AutoHeal Test Report</h1>
        <p><strong>Test Run:</strong> ${this.testRunId}</p>
        <p><strong>Generated:</strong> ${this.formatDateTime(new Date())}</p>

        <div class="stats">
            <div class="stat-box"><div class="stat-value">${this.reports.length}</div><div>Total Selectors</div></div>
            <div class="stat-box"><div class="stat-value">${stats.successful}</div><div>Successful</div></div>
            <div class="stat-box"><div class="stat-value">${stats.originalStrategy}</div><div>Original Selectors</div></div>
            <div class="stat-box"><div class="stat-value">${stats.domHealed}</div><div>DOM Healed</div></div>
            <div class="stat-box"><div class="stat-value">${stats.visualHealed}</div><div>Visual Healed</div></div>
            <div class="stat-box"><div class="stat-value">${stats.cached}</div><div>Cached Results</div></div>
        </div>

        <div class="filter-section">
            <h3>🔍 Filter Results</h3>
            <div class="filters">
                <div>
                    <label>Strategy:</label>
                    <select id="strategyFilter" class="filter-select">
                        <option value="">All Strategies</option>
                    </select>
                </div>
                <div>
                    <label>Status:</label>
                    <select id="statusFilter" class="filter-select">
                        <option value="">All Status</option>
                    </select>
                </div>
                <div>
                    <label>Performance:</label>
                    <select id="performanceFilter" class="filter-select">
                        <option value="">All Performance</option>
                    </select>
                </div>
                <div>
                    <label>Search:</label>
                    <input type="text" id="searchBox" class="search-box" placeholder="Search all columns...">
                </div>
            </div>
            <div class="filter-stats">
                <span id="resultCount">Showing ${this.reports.length} of ${this.reports.length} results</span>
                <button id="resetFilters" class="reset-btn">Reset Filters</button>
            </div>
        </div>

        ${hasAI ? this.generateAISectionHTML(stats) : ''}

        <h2>📋 Detailed Selector Report</h2>
        <table id="reportTable">
            <thead>
                <tr>
                    <th>Original Selector</th>
                    <th>Strategy</th>
                    <th>Time (ms)</th>
                    <th>Status</th>
                    <th>Actual Selector</th>
                    <th>Element</th>
                    <th>Tokens</th>
                    <th>Reasoning</th>
                </tr>
            </thead>
            <tbody>
                ${this.reports.map(r => this.generateReportRow(r)).join('\n')}
            </tbody>
        </table>

        ${this.generateJavaScriptFilter()}
    </div>
</body>
</html>`;
  }

  private generateAISectionHTML(stats: Statistics): string {
    const aiReport = this.reports.find(
      r => r.strategy === LocatorStrategy.DOM_ANALYSIS || r.strategy === LocatorStrategy.VISUAL_ANALYSIS
    );

    if (!aiReport) return '';

    return `
        <h2>🤖 AI Implementation Details</h2>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h3>Configuration</h3>
                    <ul>
                        <li><strong>Provider:</strong> ${aiReport.aiProvider}</li>
                        <li><strong>Model:</strong> ${aiReport.aiModel}</li>
                        <li><strong>API Endpoint:</strong> ${aiReport.apiEndpoint}</li>
                        <li><strong>Max Tokens:</strong> ${this.domMaxTokens} (DOM), ${this.visualMaxTokens} (Visual)</li>
                        <li><strong>Temperature:</strong> ${this.domTemperature} (DOM), ${this.visualTemperature} (Visual)</li>
                        <li><strong>Max Retries:</strong> ${aiReport.retryCount}</li>
                    </ul>
                </div>
                <div>
                    <h3>AI Usage Statistics</h3>
                    <ul>
                        <li><strong>DOM Analysis Requests:</strong> ${stats.domHealed}</li>
                        <li><strong>Visual Analysis Requests:</strong> ${stats.visualHealed}</li>
                        <li><strong>Total Tokens:</strong> ${stats.totalTokens}</li>
                        <li><strong>DOM Tokens:</strong> ${stats.domTokens}</li>
                        <li><strong>Visual Tokens:</strong> ${stats.visualTokens}</li>
                        <li><strong>Estimated Cost:</strong> $${this.estimateCost(stats.totalTokens)}</li>
                    </ul>
                </div>
            </div>
        </div>`;
  }

  private generateReportRow(report: SelectorReport): string {
    const rowClass = this.getRowClass(report.strategy, report.success);
    const statusClass = report.success ? 'success' : 'failure';
    const status = report.success ? '✅ SUCCESS' : '❌ FAILED';
    const tokensDisplay = report.tokensUsed > 0 &&
      (report.strategy === LocatorStrategy.DOM_ANALYSIS || report.strategy === LocatorStrategy.VISUAL_ANALYSIS)
      ? report.tokensUsed.toString()
      : '-';

    return `
                <tr class="${rowClass}">
                    <td><code>${this.escapeHtml(report.originalSelector)}</code></td>
                    <td>${this.getStrategyIcon(report.strategy)} ${this.getStrategyDisplayName(report.strategy)}</td>
                    <td>${report.executionTimeMs}</td>
                    <td class="${statusClass}">${status}</td>
                    <td><code>${this.escapeHtml(report.actualSelector || '-')}</code></td>
                    <td>${this.escapeHtml(report.elementDetails || '-')}</td>
                    <td>${tokensDisplay}</td>
                    <td>${this.escapeHtml(report.reasoning || '-')}</td>
                </tr>`;
  }

  private generateJavaScriptFilter(): string {
    return `
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            const table = document.getElementById('reportTable');
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            const strategyFilter = document.getElementById('strategyFilter');
            const statusFilter = document.getElementById('statusFilter');
            const performanceFilter = document.getElementById('performanceFilter');
            const searchBox = document.getElementById('searchBox');
            const resetBtn = document.getElementById('resetFilters');
            const resultCount = document.getElementById('resultCount');

            // Populate filter options
            const strategies = new Set();
            const statuses = new Set();

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 4) {
                    strategies.add(cells[1].textContent.trim());
                    statuses.add(cells[3].textContent.trim());
                }
            });

            strategies.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s; opt.textContent = s;
                strategyFilter.appendChild(opt);
            });

            statuses.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s; opt.textContent = s;
                statusFilter.appendChild(opt);
            });

            ['Fast (<100ms)', 'Medium (100-500ms)', 'Slow (>500ms)'].forEach(p => {
                const opt = document.createElement('option');
                opt.value = p; opt.textContent = p;
                performanceFilter.appendChild(opt);
            });

            function applyFilters() {
                const strategyValue = strategyFilter.value;
                const statusValue = statusFilter.value;
                const performanceValue = performanceFilter.value;
                const searchValue = searchBox.value.toLowerCase();
                let visibleCount = 0;

                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    let show = true;

                    if (cells.length >= 4) {
                        if (strategyValue && cells[1].textContent.trim() !== strategyValue) show = false;
                        if (statusValue && cells[3].textContent.trim() !== statusValue) show = false;

                        if (performanceValue) {
                            const time = parseInt(cells[2].textContent.trim());
                            let perfCategory = '';
                            if (time < 100) perfCategory = 'Fast (<100ms)';
                            else if (time < 500) perfCategory = 'Medium (100-500ms)';
                            else perfCategory = 'Slow (>500ms)';
                            if (perfCategory !== performanceValue) show = false;
                        }

                        if (searchValue) {
                            const rowText = Array.from(cells).map(c => c.textContent.toLowerCase()).join(' ');
                            if (!rowText.includes(searchValue)) show = false;
                        }
                    }

                    row.style.display = show ? '' : 'none';
                    if (show) visibleCount++;
                });

                resultCount.textContent = \`Showing \${visibleCount} of \${rows.length} results\`;
            }

            function resetFilters() {
                strategyFilter.value = '';
                statusFilter.value = '';
                performanceFilter.value = '';
                searchBox.value = '';
                applyFilters();
            }

            strategyFilter.addEventListener('change', applyFilters);
            statusFilter.addEventListener('change', applyFilters);
            performanceFilter.addEventListener('change', applyFilters);
            searchBox.addEventListener('input', applyFilters);
            resetBtn.addEventListener('click', resetFilters);
        });
        </script>`;
  }

  private generateTextContent(): string {
    const stats = this.calculateStatistics();
    const hasAI = this.reports.some(
      r => r.strategy === LocatorStrategy.DOM_ANALYSIS || r.strategy === LocatorStrategy.VISUAL_ANALYSIS
    );

    let text = `===============================================
         AutoHeal Test Report
===============================================
Test Run ID: ${this.testRunId}
Start Time: ${this.startTime.toISOString()}
End Time: ${new Date().toISOString()}
Total Selectors Tested: ${this.reports.length}
===============================================

SUMMARY STATISTICS:
- Successful: ${stats.successful} (${((stats.successful / this.reports.length) * 100).toFixed(1)}%)
- Failed: ${this.reports.length - stats.successful}
- Original Selectors (no healing): ${stats.originalStrategy}
- DOM Healed: ${stats.domHealed}
- Visual Healed: ${stats.visualHealed}
- Cached Results: ${stats.cached}
${stats.totalTokens > 0 ? `- Token Usage - Total: ${stats.totalTokens} | DOM: ${stats.domTokens} | Visual: ${stats.visualTokens}\n` : ''}
`;

    if (hasAI) {
      const aiReport = this.reports.find(
        r => r.strategy === LocatorStrategy.DOM_ANALYSIS || r.strategy === LocatorStrategy.VISUAL_ANALYSIS
      );

      if (aiReport) {
        text += `
AI IMPLEMENTATION DETAILS:
===============================================
Configuration:
- Provider: ${aiReport.aiProvider}
- Model: ${aiReport.aiModel}
- API Endpoint: ${aiReport.apiEndpoint}
- Max Tokens: ${this.domMaxTokens} (DOM), ${this.visualMaxTokens} (Visual)
- Temperature: ${this.domTemperature} (DOM), ${this.visualTemperature} (Visual)
- Max Retries: ${aiReport.retryCount}

AI Usage Statistics:
- DOM Analysis Requests: ${stats.domHealed}
- Visual Analysis Requests: ${stats.visualHealed}
- Total Tokens: ${stats.totalTokens}
- DOM Tokens: ${stats.domTokens}
- Visual Tokens: ${stats.visualTokens}
- Estimated Cost: $${this.estimateCost(stats.totalTokens)}

`;
      }
    }

    text += `DETAILED SELECTOR REPORT:
===============================================
`;

    this.reports.forEach((report, i) => {
      text += `${i + 1}. ${report.originalSelector}
   Strategy: ${this.getStrategyIcon(report.strategy)} ${this.getStrategyDisplayName(report.strategy)}
   Time: ${report.executionTimeMs}ms
   Status: ${report.success ? 'SUCCESS' : 'FAILED'}
${report.tokensUsed > 0 && (report.strategy === LocatorStrategy.DOM_ANALYSIS || report.strategy === LocatorStrategy.VISUAL_ANALYSIS) ? `   Tokens: ${report.tokensUsed}\n` : ''}${report.success ? `   Actual Selector: ${report.actualSelector}
   Element: ${report.elementDetails}
   Reasoning: ${report.reasoning}
` : ''}   Description: ${report.description}
   Timestamp: ${report.timestamp.toTimeString().split(' ')[0]}
-----------------------------------------------
`;
    });

    return text;
  }

  private calculateStatistics(): Statistics {
    const successful = this.reports.filter(r => r.success).length;
    const originalStrategy = this.reports.filter(r => r.strategy === LocatorStrategy.ORIGINAL_SELECTOR).length;
    const domHealed = this.reports.filter(r => r.strategy === LocatorStrategy.DOM_ANALYSIS).length;
    const visualHealed = this.reports.filter(r => r.strategy === LocatorStrategy.VISUAL_ANALYSIS).length;
    const cached = this.reports.filter(r => r.strategy === LocatorStrategy.CACHED).length;

    const totalTokens = this.reports.reduce((sum, r) => sum + r.tokensUsed, 0);
    const domTokens = this.reports
      .filter(r => r.strategy === LocatorStrategy.DOM_ANALYSIS)
      .reduce((sum, r) => sum + r.tokensUsed, 0);
    const visualTokens = this.reports
      .filter(r => r.strategy === LocatorStrategy.VISUAL_ANALYSIS)
      .reduce((sum, r) => sum + r.tokensUsed, 0);

    return {
      successful,
      originalStrategy,
      domHealed,
      visualHealed,
      cached,
      totalTokens,
      domTokens,
      visualTokens,
    };
  }

  private getStrategyIcon(strategy: LocatorStrategy): string {
    switch (strategy) {
      case LocatorStrategy.ORIGINAL_SELECTOR:
        return '✅';
      case LocatorStrategy.DOM_ANALYSIS:
        return '🤖';
      case LocatorStrategy.VISUAL_ANALYSIS:
        return '👁️';
      case LocatorStrategy.CACHED:
        return '💾';
      default:
        return '❌';
    }
  }

  private getStrategyDisplayName(strategy: LocatorStrategy): string {
    switch (strategy) {
      case LocatorStrategy.ORIGINAL_SELECTOR:
        return 'Original Selector';
      case LocatorStrategy.DOM_ANALYSIS:
        return 'DOM Analysis (AI)';
      case LocatorStrategy.VISUAL_ANALYSIS:
        return 'Visual Analysis (AI)';
      case LocatorStrategy.CACHED:
        return 'Cached Result';
      default:
        return 'Failed';
    }
  }

  private getRowClass(strategy: LocatorStrategy, success: boolean): string {
    if (!success) return 'failed';
    switch (strategy) {
      case LocatorStrategy.ORIGINAL_SELECTOR:
        return 'original';
      case LocatorStrategy.DOM_ANALYSIS:
        return 'dom-healed';
      case LocatorStrategy.VISUAL_ANALYSIS:
        return 'visual-healed';
      case LocatorStrategy.CACHED:
        return 'cached';
      default:
        return 'failed';
    }
  }

  private estimateCost(totalTokens: number): string {
    // Gemini 2.0 Flash pricing: ~$0.075 per 1M tokens (average)
    const cost = (totalTokens * 0.075) / 1000000.0;
    return cost.toFixed(4);
  }

  private formatDateTime(date: Date): string {
    return date.toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

interface SelectorReport {
  originalSelector: string;
  actualSelector: string;
  description: string;
  strategy: LocatorStrategy;
  executionTimeMs: number;
  success: boolean;
  elementDetails: string;
  reasoning: string;
  tokensUsed: number;
  timestamp: Date;
  aiProvider: string;
  aiModel: string;
  apiEndpoint: string;
  maxTokens: number;
  temperature: number;
  retryCount: number;
  promptType: string;
  promptTokens: number;
  completionTokens: number;
}

interface Statistics {
  successful: number;
  originalStrategy: number;
  domHealed: number;
  visualHealed: number;
  cached: number;
  totalTokens: number;
  domTokens: number;
  visualTokens: number;
}
