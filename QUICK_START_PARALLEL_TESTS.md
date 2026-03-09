# 🚀 Quick Start: Parallel Tests

Run AutoHeal parallel tests in 3 simple steps!

---

## Step 1: Install Dependencies

```bash
# Install Playwright Test
npm install -D @playwright/test

# Install Chromium browser
npx playwright install chromium

# Build the project
npm run build
```

---

## Step 2: Set API Key

Create `.env` file in project root:

```bash
GEMINI_API_KEY=your_api_key_here
```

Get free API key: https://makersuite.google.com/app/apikey

---

## Step 3: Run Tests

### 🪟 Windows
```bash
cd tests
run-parallel-tests.bat
```

### 🐧 Linux/Mac
```bash
cd tests
chmod +x run-parallel-tests.sh
./run-parallel-tests.sh
```

### ⚡ Quick Commands

```bash
# Run all tests (3 parallel workers)
npx playwright test tests/playwright-parallel.spec.ts --workers=3

# Run isolated tests only
npx playwright test tests/playwright-parallel.spec.ts -g "Isolated"

# Run shared cache tests
npx playwright test tests/playwright-parallel.spec.ts -g "Shared"

# Run performance tests
npx playwright test tests/playwright-parallel.spec.ts -g "Performance"

# View HTML report
npx playwright show-report
```

---

## 📊 What You'll See

### Console Output
```
🧪 [Test 1] Starting at 2025-01-15T10:30:00.000Z
🧪 [Test 2] Starting at 2025-01-15T10:30:00.100Z
🧪 [Test 3] Starting at 2025-01-15T10:30:00.200Z

🔍 [Test 1] Finding username field...
Original locator worked: #user-name

📊 [Test 1] Cache Metrics: { hits: 0, misses: 3, hitRate: '0.00%' }
✅ [Test 1] Completed at 2025-01-15T10:30:08.500Z
```

### Test Results
```
Running 9 tests using 3 workers

  ✓ Test 1: Login with user 1 @parallel (8.5s)
  ✓ Test 2: Login with user 2 @parallel (8.3s)
  ✓ Test 3: Browse products @parallel (9.1s)

  9 passed (10s)
```

---

## 🎯 Key Learnings

### 1. **Isolated Instances** (Recommended)
- Each test has its own AutoHeal instance
- No cache sharing
- Thread-safe ✅
- Best for independent tests

### 2. **Shared Cache**
- All tests share one instance
- Cache benefits across tests
- Potential race conditions ⚠️
- First test slower, others faster

### 3. **Performance**
- Cache hit: ~1-2 seconds
- Cache miss: ~8-10 seconds
- **5-6x speedup** with cache! 🚀

---

## ⚠️ Important Notes

### API Rate Limits
**Gemini Free Tier:**
- 15 requests per minute
- If you hit limits, reduce workers:
  ```bash
  npx playwright test --workers=2
  ```

### Cache Settings to Test

**Memory Cache (Isolated):**
```typescript
cache: {
  type: CacheType.MEMORY  // ← Each instance has own cache
}
```

**File Cache (Shared):**
```typescript
cache: {
  type: CacheType.PERSISTENT_FILE,  // ← Shared across instances
  cacheDirectory: './autoheal-cache-parallel-test'
}
```

### Timeout Configuration
```typescript
ai: {
  timeout: 30000,    // Each AI call max 30s
  maxRetries: 3      // Retry 3 times on rate limits
}
```

---

## 🐛 Troubleshooting

### Tests timeout
```typescript
// Increase AI timeout
ai: { timeout: 60000 }
```

### Rate limit errors
```bash
# Reduce parallel workers
npx playwright test --workers=1
```

### Cache not working
```bash
# Clear cache
rm -rf ./autoheal-cache-parallel-test
# or on Windows:
rmdir /s /q autoheal-cache-parallel-test
```

---

## 📚 Full Documentation

See [tests/PARALLEL_TESTS_README.md](tests/PARALLEL_TESTS_README.md) for complete details.

---

**Happy Testing! 🎉**
