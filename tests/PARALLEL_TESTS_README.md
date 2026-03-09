# 🔄 AutoHeal Parallel Testing Guide

This guide explains how to run and understand parallel tests with AutoHeal Locator.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Understanding Cache Behavior](#understanding-cache-behavior)
5. [What to Observe](#what-to-observe)
6. [Important Considerations](#important-considerations)

---

## ✅ Prerequisites

### 1. Install Playwright
```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 2. Set up API Key
Create a `.env` file in the project root:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your free API key: https://makersuite.google.com/app/apikey

### 3. Build the project
```bash
npm run build
```

---

## 🏗️ Test Structure

The test suite includes **3 test groups**:

### 1️⃣ **Isolated Instances** (Recommended for most cases)
- Each test creates its own AutoHeal instance
- Each instance has its own **MEMORY cache** (isolated)
- **Cache behavior:** No sharing between tests
- **Thread-safe:** ✅ Yes
- **Best for:** Independent test suites

### 2️⃣ **Shared File Cache**
- All tests share one AutoHeal instance
- Uses **PERSISTENT FILE cache** (shared)
- **Cache behavior:** Tests benefit from each other's caching
- **Thread-safe:** ⚠️ Potential race conditions
- **Best for:** Understanding cache sharing effects

### 3️⃣ **Performance Comparison**
- Compares cache vs no-cache performance
- Measures execution time differences
- **Best for:** Benchmarking

---

## 🚀 Running Tests

### Run ALL parallel tests
```bash
npx playwright test tests/playwright-parallel.spec.ts
```

### Run with specific number of workers
```bash
# Run with 3 parallel workers (default)
npx playwright test tests/playwright-parallel.spec.ts --workers=3

# Run with 5 parallel workers
npx playwright test tests/playwright-parallel.spec.ts --workers=5

# Run sequentially (no parallelism)
npx playwright test tests/playwright-parallel.spec.ts --workers=1
```

### Run specific test group
```bash
# Only isolated instance tests
npx playwright test tests/playwright-parallel.spec.ts -g "Isolated Instances"

# Only shared cache tests
npx playwright test tests/playwright-parallel.spec.ts -g "Shared File Cache"

# Only performance tests
npx playwright test tests/playwright-parallel.spec.ts -g "Performance Tests"
```

### Run with tags
```bash
# Run only parallel tagged tests
npx playwright test tests/playwright-parallel.spec.ts -g "@parallel"

# Run only shared cache tests
npx playwright test tests/playwright-parallel.spec.ts -g "@shared"

# Run cache comparison tests
npx playwright test tests/playwright-parallel.spec.ts -g "@nocache|@withcache"
```

### Debug mode (see detailed logs)
```bash
npx playwright test tests/playwright-parallel.spec.ts --debug
```

### Headed mode (see browser)
```bash
npx playwright test tests/playwright-parallel.spec.ts --headed
```

### Generate HTML report
```bash
npx playwright test tests/playwright-parallel.spec.ts
npx playwright show-report
```

---

## 💾 Understanding Cache Behavior

### Scenario 1: Isolated Instances (MEMORY cache)

```typescript
// Test 1
const autoHeal1 = AutoHealLocator.builder()
  .withConfiguration({ cache: { type: CacheType.MEMORY } })
  .build();

// Test 2
const autoHeal2 = AutoHealLocator.builder()
  .withConfiguration({ cache: { type: CacheType.MEMORY } })
  .build();
```

**Result:**
- ✅ Each test has its own cache
- ✅ No interference between tests
- ❌ No cache reuse between tests
- ✅ **Thread-safe**

**Expected Output:**
```
Test 1 Cache: hits=0, misses=3  (first time, no cache)
Test 2 Cache: hits=0, misses=3  (separate cache, starts fresh)
Test 3 Cache: hits=0, misses=4  (separate cache, starts fresh)
```

### Scenario 2: Shared Instance (FILE cache)

```typescript
// Shared across all tests
const sharedAutoHeal = AutoHealLocator.builder()
  .withConfiguration({
    cache: {
      type: CacheType.PERSISTENT_FILE,
      cacheDirectory: './autoheal-cache-parallel-test'
    }
  })
  .build();
```

**Result:**
- ✅ All tests share the same cache
- ✅ Later tests benefit from earlier caching
- ⚠️ Potential race conditions if tests modify same elements
- ⚠️ **May have thread-safety issues**

**Expected Output:**
```
Test 1 Cache: hits=0, misses=3  (first test, builds cache)
Test 2 Cache: hits=3, misses=0  (benefits from Test 1's cache!)
Test 3 Cache: hits=3, misses=0  (benefits from cached data!)
```

---

## 🔍 What to Observe

### 1. **Console Output**
Watch for timestamps to see parallel execution:
```
🧪 [Test 1] Starting at 2025-01-15T10:30:00.000Z
🧪 [Test 2] Starting at 2025-01-15T10:30:00.100Z  ← Started almost simultaneously!
🧪 [Test 3] Starting at 2025-01-15T10:30:00.200Z  ← All running in parallel
```

### 2. **Cache Metrics**
Each test shows its cache performance:
```
📊 [Test 1] Cache Metrics: { hits: 0, misses: 3, hitRate: '0.00%' }
📊 [Test 2] Cache Metrics: { hits: 0, misses: 3, hitRate: '0.00%' }
```

### 3. **Execution Time**
Compare performance with/without cache:
```
⏱️  [No-Cache] Duration: 8500ms
⏱️  [With-Cache] Duration: 1200ms  ← Much faster with cache!
```

### 4. **AI Healing Activity**
Look for healing messages:
```
Original locator worked: #user-name
Cache hit: #password -> #password
Performing AI healing for: Login button
AI healing successful: #login-button -> [data-test="login-button"]
```

---

## ⚠️ Important Considerations

### 1. **API Rate Limits**
Running many tests in parallel may hit rate limits:

**Gemini Free Tier:**
- 15 requests per minute
- 1 million tokens per day

**If you hit rate limits:**
```bash
# Reduce parallel workers
npx playwright test --workers=2

# Or use retry configuration
ai: { maxRetries: 5 }
```

### 2. **Cache Directory Conflicts**
When using shared file cache:

**Problem:** Multiple tests writing to same cache file simultaneously
**Solution:** Use different cache directories or isolated instances

```typescript
// Option 1: Different directories per test
cache: { cacheDirectory: `./cache-test-${testId}` }

// Option 2: Use memory cache for parallel tests
cache: { type: CacheType.MEMORY }
```

### 3. **Resource Usage**
Parallel tests consume more resources:

**Monitor:**
- CPU usage (multiple browsers + AI calls)
- Memory usage (cache + browser contexts)
- Network bandwidth (simultaneous API calls)

**Recommendations:**
```bash
# On powerful machines
--workers=5

# On CI/CD or limited resources
--workers=2

# Sequential (debugging)
--workers=1
```

### 4. **Test Independence**
Ensure tests don't depend on each other:

**❌ Bad:**
```typescript
test('Login', async () => { /* creates session */ });
test('Use session', async () => { /* depends on previous test */ });
```

**✅ Good:**
```typescript
test('Login 1', async () => { /* fully independent */ });
test('Login 2', async () => { /* fully independent */ });
```

---

## 📊 Expected Results

### Isolated Instances (3 workers)
```
Test 1: ✅ Pass (8.5s)  - Cache: 0 hits
Test 2: ✅ Pass (8.3s)  - Cache: 0 hits
Test 3: ✅ Pass (9.1s)  - Cache: 0 hits

Total: ~9s (tests run in parallel)
```

### Shared File Cache (3 workers)
```
Test 1: ✅ Pass (8.5s)  - Cache: 0 hits, 3 misses
Test 2: ✅ Pass (1.2s)  - Cache: 3 hits, 0 misses  ← Much faster!
Test 3: ✅ Pass (1.1s)  - Cache: 3 hits, 0 misses  ← Much faster!

Total: ~9s (first test takes longest, others fast)
Cache efficiency: 67% hit rate across all tests
```

### Performance Comparison (sequential)
```
No Cache:   ✅ Pass (8.5s)
With Cache: ✅ Pass (8.2s first run, 1.5s on cache hit)

Speedup: ~5-6x faster with cache on subsequent runs
```

---

## 🎯 Recommendations

### For Development
```bash
# Use isolated instances with memory cache
# Fast, no side effects, good for debugging
npx playwright test tests/playwright-parallel.spec.ts -g "Isolated" --workers=3
```

### For CI/CD
```bash
# Sequential execution to avoid rate limits
# Use persistent file cache to speed up subsequent runs
npx playwright test tests/playwright-parallel.spec.ts --workers=1
```

### For Performance Testing
```bash
# Run performance comparison tests
npx playwright test tests/playwright-parallel.spec.ts -g "Performance"
```

---

## 🐛 Troubleshooting

### Issue: Tests timeout
**Cause:** AI calls taking too long or rate limits
**Solution:**
```typescript
ai: {
  timeout: 60000,  // Increase timeout
  maxRetries: 5    // More retries for rate limits
}
```

### Issue: Cache not working
**Cause:** Cache directory permissions or conflicts
**Solution:**
```bash
# Clear cache directory
rm -rf ./autoheal-cache-parallel-test

# Or use memory cache
cache: { type: CacheType.MEMORY }
```

### Issue: Rate limit errors
**Cause:** Too many parallel API calls
**Solution:**
```bash
# Reduce workers
npx playwright test --workers=1

# Or wait between test runs
# Gemini resets limits every minute
```

### Issue: Inconsistent results
**Cause:** Race conditions with shared cache
**Solution:**
Use isolated instances instead of shared cache for parallel tests

---

## 📚 Additional Resources

- [Playwright Parallel Execution](https://playwright.dev/docs/test-parallel)
- [AutoHeal Documentation](../README.md)
- [Gemini API Limits](https://ai.google.dev/pricing)

---

## 🎓 Learning Outcomes

After running these tests, you'll understand:

1. ✅ How AutoHeal handles concurrent test execution
2. ✅ The difference between memory and file cache
3. ✅ Cache sharing benefits and trade-offs
4. ✅ Performance impact of caching
5. ✅ Thread-safety considerations
6. ✅ API rate limit management
7. ✅ Optimal configuration for different scenarios

**Happy Testing! 🚀**
