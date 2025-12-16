# Playwright to AutoHeal Conversion Guide

**Good news: No conversion needed!** AutoHeal accepts Playwright's native Locator objects directly.

## Pattern

```typescript
// ✅ AutoHeal accepts BOTH native Locators AND string selectors
const locator = await autoHeal.find(
  page,
  page.getByRole('button', { name: 'Submit' }),  // Native Playwright Locator
  // OR
  '#submit-button',  // CSS selector string
  'Submit button description'  // Description for AI healing
);

// Then use with Playwright's expect and actions
await expect(locator).toBeVisible();
await locator.click();
```

## Simple Usage Examples

### 1. Heading/Role Selectors

```typescript
// ✅ Use Playwright's native locator directly!
const heading = await autoHeal.find(
  page,
  page.getByRole('heading', { name: 'Sign up' }),  // Native Playwright Locator
  'Sign up heading'
);
await expect(heading).toBeVisible();
await expect(heading).toContainText('Sign up');
```

### 2. Checkbox Selectors

```typescript
// ✅ Use Playwright's native locator directly!
const checkbox = await autoHeal.find(
  page,
  page.getByRole('checkbox', { name: 'Subscribe' }),
  'Subscribe checkbox'
);
await expect(checkbox).toBeVisible();
await checkbox.check();
```

### 3. Button Selectors with Regex

```typescript
// ✅ Use Playwright's native locator directly!
const submitButton = await autoHeal.find(
  page,
  page.getByRole('button', { name: /submit/i }),
  'Submit button'
);
await expect(submitButton).toBeEnabled();
await submitButton.click();
```

### 4. Input Fields

```typescript
// ✅ Use Playwright's native locator directly!
const emailInput = await autoHeal.find(
  page,
  page.getByPlaceholder('Enter email'),
  'Email input field'
);
await expect(emailInput).toBeVisible();
await emailInput.fill('test@example.com');
```

### 5. Text Content

```typescript
// ✅ Use Playwright's native locator directly!
const welcomeText = await autoHeal.find(
  page,
  page.getByText('Welcome back'),
  'Welcome back text'
);
await expect(welcomeText).toBeVisible();
await welcomeText.click();
```

## Tips for Testing Wrong Selectors

### Make Selectors Wrong on Purpose

```typescript
// Real selector: #user-name
// Test with: #username-field (wrong!)
const input = await autoHeal.find(
  page,
  '#username-field',  // ❌ Wrong
  'Username input'
);

// Real selector: [data-test="login-button"]
// Test with: button.login (wrong!)
const button = await autoHeal.find(
  page,
  'button.login',  // ❌ Wrong
  'Login button'
);
```

### Use Good Descriptions

The description helps AI find the element when selector fails:

```typescript
// ❌ Bad description (too vague)
await autoHeal.find(page, '.wrong', 'element');

// ✅ Good description (specific)
await autoHeal.find(page, '.wrong', 'Red submit button at bottom of login form');
```

## Common Use Cases

### Form Filling

```typescript
// Username
const username = await autoHeal.find(page, '#user', 'Username input');
await username.fill('testuser');

// Password
const password = await autoHeal.find(page, '#pass', 'Password input');
await password.fill('password123');

// Submit
const submit = await autoHeal.find(page, 'button', 'Submit button');
await submit.click();
```

### Assertions with expect()

```typescript
const element = await autoHeal.find(page, '.wrong-selector', 'Element description');

// All Playwright assertions work!
await expect(element).toBeVisible();
await expect(element).toBeEnabled();
await expect(element).toHaveText('Expected text');
await expect(element).toHaveAttribute('href', '/link');
await expect(element).toHaveClass('active');
```

### Actions

```typescript
const element = await autoHeal.find(page, '.selector', 'Description');

// All Playwright actions work!
await element.click();
await element.fill('text');
await element.check(); // for checkboxes
await element.selectOption('value'); // for dropdowns
await element.hover();
await element.focus();
const text = await element.textContent();
const value = await element.inputValue();
```

## Run the Test

```bash
# Run the wrong selectors test
npx ts-node examples/playwright-wrong-selectors-test.ts
```

## Strategy Options

```typescript
// DOM first (fast & cheap), fallback to Visual
.withStrategy(ExecutionStrategy.SMART_SEQUENTIAL)

// Visual first (better for complex UIs), fallback to DOM
.withStrategy(ExecutionStrategy.VISUAL_FIRST)

// DOM only (no visual fallback)
.withStrategy(ExecutionStrategy.DOM_ONLY)
```
