# Playwright Locator Format Enhancement Plan

**Issue**: Currently healed selectors are returned in CSS selector format (e.g., `#username`) instead of user-facing Playwright method format (e.g., `getByLabel('Username')`).

**User Requirement**: When AI heals a locator, it should return the complete Playwright method format that users can directly copy-paste into their scripts.

---

## Current Behavior (TypeScript)

**AI Response:**
```json
{
  "selector": "#username",
  "confidence": 0.95,
  "reasoning": "Found username input with ID"
}
```

**Console Output:**
```
AI healing successful: getByRole('textbox', { name: 'email' }) -> #username
```

**Problem**: User gets `#username` but has to manually convert it to `page.locator('#username')` or another Playwright method.

---

## Desired Behavior (Based on Java Implementation)

**AI Response:**
```json
{
  "locatorType": "getByRole",
  "value": "textbox",
  "options": {"name": "Username"},
  "confidence": 0.95,
  "reasoning": "Input has associated label 'Username'"
}
```

**Console Output:**
```
AI healing successful: getByRole('textbox', { name: 'email' }) -> getByRole('textbox', { name: 'Username' })
```

**Benefit**: User can directly copy `getByRole('textbox', { name: 'Username' })` and use it as `page.getByRole('textbox', { name: 'Username' })`.

---

## Java Implementation Analysis

### 1. Prompt Structure (ResilientAIService.java:133-165)

Java uses a **structured JSON response** format:

```java
{
    "locatorType": "getByRole|getByLabel|getByPlaceholder|getByText|getByTestId|css",
    "value": "button|Username|.class-name",
    "options": {"name": "Submit"},
    "confidence": 0.95,
    "reasoning": "brief explanation"
}
```

**Priority Order:**
1. `getByRole()` - ARIA role with accessible name
2. `getByLabel()` - Form label text
3. `getByPlaceholder()` - Input placeholder
4. `getByText()` - Visible text
5. `getByTestId()` - Test ID attribute
6. CSS Selector - Fallback only

### 2. Response Parsing (ResilientAIService.java:837-895)

Java detects format by checking for `locatorType` field:

```java
if (aiResponse.has("locatorType")) {
    return parsePlaywrightDOMContent(aiResponse);  // Playwright format
} else {
    return parseSeleniumDOMContent(aiResponse);    // Selenium format
}
```

### 3. PlaywrightLocator Model (PlaywrightLocator.java)

Java creates a **type-safe object**:

```java
public enum Type {
    GET_BY_ROLE,
    GET_BY_LABEL,
    GET_BY_PLACEHOLDER,
    GET_BY_TEXT,
    GET_BY_TEST_ID,
    CSS_SELECTOR
}

PlaywrightLocator(Type.GET_BY_ROLE, "button", {"name": "Submit"})
```

### 4. Execution (PlaywrightWebAutomationAdapter.java:157-193)

Java **executes** the locator using actual Playwright methods:

```java
switch (playwrightLocator.getType()) {
    case GET_BY_ROLE:
        String roleName = playwrightLocator.getValue();
        Object nameOption = playwrightLocator.getOption("name");

        if (nameOption != null) {
            return page.getByRole(parseAriaRole(roleName),
                new Page.GetByRoleOptions().setName(nameOption.toString()));
        } else {
            return page.getByRole(parseAriaRole(roleName));
        }
    case GET_BY_LABEL:
        return page.getByLabel(playwrightLocator.getValue());
    // ... etc
}
```

### 5. Display Format

For **logs and reports**, Java shows the method call format for user readability while internally using the native Playwright API.

---

## Implementation Plan for TypeScript

### Phase 1: Update AI Prompt Templates

**Files to Update:**
- `src/ai/GeminiAIService.ts`
- `src/ai/OpenAIService.ts`
- `src/ai/AnthropicService.ts`
- `src/ai/DeepSeekService.ts`
- `src/ai/GrokService.ts`
- `src/ai/GroqAIService.ts`

**Change:**
```typescript
// OLD FORMAT
{
    "selector": "#username",
    "confidence": 0.95,
    "reasoning": "Found username input"
}

// NEW FORMAT
{
    "locatorType": "getByRole",
    "value": "textbox",
    "options": {"name": "Username"},
    "confidence": 0.95,
    "reasoning": "Input has associated label"
}
```

### Phase 2: Create PlaywrightLocator Model

**New File:** `src/models/PlaywrightLocator.ts`

```typescript
export enum PlaywrightLocatorType {
  GET_BY_ROLE = 'getByRole',
  GET_BY_PLACEHOLDER = 'getByPlaceholder',
  GET_BY_TEXT = 'getByText',
  GET_BY_TEST_ID = 'getByTestId',
  LOCATOR = 'locator'
}

export interface PlaywrightLocator {
  type: PlaywrightLocatorType;
  value: string;
  options?: { [key: string]: string };
}
```

### Phase 3: Update Response Parsers

**All AI Service Files:**

Add logic to detect and parse structured format:

```typescript
private parseAIResponse(text: string, framework: AutomationFramework): AIAnalysisResult {
  const parsed = JSON.parse(jsonText);

  // Detect Playwright structured format
  if (framework === AutomationFramework.PLAYWRIGHT && parsed.locatorType) {
    return this.parsePlaywrightResponse(parsed);
  } else {
    return this.parseSeleniumResponse(parsed);
  }
}

private parsePlaywrightResponse(parsed: any): AIAnalysisResult {
  const playwrightLocator: PlaywrightLocator = {
    type: parsed.locatorType,
    value: parsed.value,
    options: parsed.options
  };

  // Convert to selector engine syntax for execution
  const executableSelector = this.convertToSelectorEngine(playwrightLocator);

  // Convert to method call format for display
  const displaySelector = this.convertToMethodCall(playwrightLocator);

  return {
    recommendedSelector: executableSelector,  // For execution
    displaySelector: displaySelector,         // For logs/reports (NEW)
    confidence: parsed.confidence,
    reasoning: parsed.reasoning
  };
}
```

### Phase 4: Selector Conversion Utilities

**Add two conversion methods:**

```typescript
// For EXECUTION (what page.locator() understands)
private convertToSelectorEngine(locator: PlaywrightLocator): string {
  switch (locator.type) {
    case 'getByRole':
      if (locator.options?.name) {
        return `role=${locator.value}[name="${locator.options.name}"]`;
      }
      return `role=${locator.value}`;
    case 'getByPlaceholder':
      return `placeholder=${locator.value}`;
    case 'getByText':
      return `text=${locator.value}`;
    case 'getByTestId':
      return `data-testid=${locator.value}`;
    case 'locator':
    default:
      return locator.value; // Already CSS/XPath
  }
}

// For DISPLAY (what users see in logs/reports)
private convertToMethodCall(locator: PlaywrightLocator): string {
  switch (locator.type) {
    case 'getByRole':
      if (locator.options?.name) {
        return `getByRole('${locator.value}', { name: '${locator.options.name}' })`;
      }
      return `getByRole('${locator.value}')`;
    case 'getByPlaceholder':
      return `getByPlaceholder('${locator.value}')`;
    case 'getByText':
      return `getByText('${locator.value}')`;
    case 'getByTestId':
      return `getByTestId('${locator.value}')`;
    case 'locator':
    default:
      return `locator('${locator.value}')`;
  }
}
```

### Phase 5: Update AIAnalysisResult Interface

**File:** `src/interfaces/AIService.ts`

```typescript
export interface AIAnalysisResult {
  recommendedSelector: string;      // Selector engine syntax for execution
  displaySelector?: string;          // Method call format for display (NEW)
  confidence: number;
  reasoning: string;
  alternativeSelectors: string[];
  tokensUsed: number;
}
```

### Phase 6: Update Logging and Reports

**Files to Update:**
- `src/core/AutoHealLocator.ts` - Update console.log statements
- `src/reports/HealingReporter.ts` - Update report generation

**Change:**
```typescript
// Use displaySelector when showing to user
console.log(`AI healing successful: ${originalSelector} -> ${result.displaySelector || result.recommendedSelector}`);

// But use recommendedSelector for execution
const elements = await this.adapter.findElements(result.recommendedSelector);
```

---

## Supported Playwright Selector Engines

Based on Playwright documentation:

| Locator Type | Selector Engine | Example |
|-------------|----------------|---------|
| `getByRole()` | `role=` | `role=button[name="Submit"]` |
| `getByPlaceholder()` | `placeholder=` | `placeholder=Enter email` |
| `getByText()` | `text=` | `text=Welcome` |
| `getByTestId()` | `data-testid=` | `data-testid=submit` |
| `locator()` | CSS/XPath | `#username`, `//button` |

**Note:** Playwright doesn't have `label=` selector engine. For inputs with labels, use `getByRole('textbox', { name: 'Label Text' })` which finds the label and navigates to associated input.

---

## Testing Strategy

1. **Unit Tests**: Test conversion functions
2. **Integration Tests**: Test with different locator types
3. **Real-world Tests**: Test with actual websites (SauceDemo, Rahul Shetty Academy)

---

## Migration Notes

### Breaking Changes
- AI response format changes from `{selector: string}` to `{locatorType, value, options}`
- Need to update all 6 AI service providers

### Backward Compatibility
- Keep legacy format support by detecting `selector` vs `locatorType` field
- Gradual rollout: update one AI provider at a time

### Estimated Effort
- **Small**: Update prompts (1-2 hours)
- **Medium**: Update response parsers (2-3 hours)
- **Medium**: Add conversion utilities (2-3 hours)
- **Small**: Update logging/reports (1-2 hours)
- **Medium**: Testing and validation (3-4 hours)

**Total**: ~10-14 hours

---

## Benefits

1. **Better UX**: Users can copy-paste healed selectors directly
2. **Consistency**: Matches Java implementation
3. **Clarity**: Clear distinction between user-facing and accessibility locators
4. **Maintainability**: Type-safe locator model
5. **Flexibility**: Easy to add new locator types in future

---

## References

- Java Implementation: `C:\Backup\autoheal-locator\`
  - `ResilientAIService.java` - Prompt templates and parsing
  - `PlaywrightLocator.java` - Locator model
  - `PlaywrightWebAutomationAdapter.java` - Execution logic
- Playwright Docs: https://playwright.dev/docs/locators
- Playwright Selector Engines: https://playwright.dev/docs/other-locators

---

**Created**: 2025-12-19
**Status**: Planning Phase
**Target Version**: v1.1.0
