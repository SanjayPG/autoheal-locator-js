# Publishing AutoHeal to npm Registry

This guide shows you how to publish `autoheal-locator-js` to npm, similar to how the Java version is published to Maven Central.

---

## 📋 Prerequisites

1. **npm account**: Sign up at https://www.npmjs.com/signup
2. **Node.js**: Version 16+ installed
3. **Git**: For version control (optional but recommended)

---

## 🚀 Publishing to npm (Public Registry)

### Step 1: Create npm Account

```bash
# If you don't have an npm account yet
# Go to: https://www.npmjs.com/signup

# Login to npm
npm login
# Enter your username, password, and email
```

### Step 2: Update Package Name (Important!)

The name `autoheal-locator-js` might be taken. Check availability:

```bash
npm view autoheal-locator-js
```

If taken, update `package.json`:
```json
{
  "name": "@yourusername/autoheal-locator-js",
  // OR
  "name": "autoheal-selenium-playwright",
  // OR choose another unique name
}
```

**Scoped packages** (`@yourusername/package-name`) are always unique!

### Step 3: Build the Package

```bash
cd C:\Backup\autoheal-locator-js

# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Verify dist/ folder was created
ls dist/
```

### Step 4: Test Package Locally (Optional but Recommended)

```bash
# Create a tarball (simulates npm publishing)
npm pack

# This creates: autoheal-locator-js-1.0.0.tgz

# Test in another project
cd C:\Backup\autoheal-playwright-sample
npm install ../autoheal-locator-js/autoheal-locator-js-1.0.0.tgz
```

### Step 5: Publish to npm!

```bash
cd C:\Backup\autoheal-locator-js

# For public package (free)
npm publish --access public

# For scoped package
npm publish --access public
```

**That's it!** Your package is now on npm! 🎉

---

## 📦 Using the Published Package

After publishing, anyone can install it:

```bash
# Install from npm
npm install autoheal-locator-js

# Or if scoped
npm install @yourusername/autoheal-locator-js
```

Then use it:
```typescript
import { AutoHealLocator } from 'autoheal-locator-js';
```

---

## 🔄 Publishing Updates

When you make changes:

### Step 1: Update Version

Edit `package.json`:
```json
{
  "version": "1.0.1"  // Increment version
}
```

Or use npm:
```bash
# Patch version (1.0.0 → 1.0.1)
npm version patch

# Minor version (1.0.0 → 1.1.0)
npm version minor

# Major version (1.0.0 → 2.0.0)
npm version major
```

### Step 2: Publish Update

```bash
npm run build
npm publish
```

---

## 🔧 Local Development Setup (npm link)

For **local development** before publishing:

### Step 1: Link the Library Globally

```bash
cd C:\Backup\autoheal-locator-js

# Build it
npm run build

# Create global symlink
npm link
```

### Step 2: Link in Sample Projects

**Playwright Sample:**
```bash
cd C:\Backup\autoheal-playwright-sample
npm link autoheal-locator-js
```

**Selenium Sample:**
```bash
cd C:\Backup\autoheal-selenium-sample
npm link autoheal-locator-js
```

### Step 3: Update Imports

**Before:**
```typescript
import { AutoHealLocator } from '../../../autoheal-locator-js/src';
```

**After:**
```typescript
import { AutoHealLocator } from 'autoheal-locator-js';
```

Now the samples use the library like a real npm package!

---

## 📊 Comparison: npm vs Maven Central

| Feature | Maven Central (Java) | npm (JavaScript) |
|---------|---------------------|------------------|
| **Registry** | central.sonatype.org | npmjs.com |
| **Package Manager** | Maven/Gradle | npm/yarn/pnpm |
| **Publish Command** | `mvn deploy` | `npm publish` |
| **Install Command** | Add to `pom.xml` | `npm install` |
| **Versioning** | Same (semver) | Same (semver) |
| **Scoped Packages** | Group ID | `@username/package` |
| **Free Hosting** | ✅ Yes | ✅ Yes |

---

## 🎯 Package Naming Options

### Option 1: Simple Name (if available)
```json
{
  "name": "autoheal-locator-js"
}
```
Install: `npm install autoheal-locator-js`

### Option 2: Scoped Package (Always Available)
```json
{
  "name": "@yourusername/autoheal-locator"
}
```
Install: `npm install @yourusername/autoheal-locator`

### Option 3: Alternative Name
```json
{
  "name": "autoheal-selenium-playwright"
}
```
Install: `npm install autoheal-selenium-playwright`

**Recommendation**: Use **scoped package** (`@yourusername/autoheal-locator`) - it's always available and professional!

---

## ✅ Verification Checklist

Before publishing:

- [ ] `npm run build` completes successfully
- [ ] `dist/` folder contains compiled JavaScript
- [ ] `dist/index.js` and `dist/index.d.ts` exist
- [ ] `package.json` has correct version
- [ ] `package.json` has correct repository URL
- [ ] `README.md` is comprehensive
- [ ] `LICENSE` file exists
- [ ] `.npmignore` excludes source files
- [ ] Logged in to npm (`npm whoami`)
- [ ] Package name is available or scoped

---

## 🔍 Test Before Publishing

```bash
# Check what files will be included
npm pack --dry-run

# Or create actual tarball
npm pack

# Extract and inspect
tar -xzf autoheal-locator-js-1.0.0.tgz
cd package/
ls -la
```

---

## 📝 Complete Publishing Script

Save as `publish.sh`:

```bash
#!/bin/bash

# Publishing script for autoheal-locator-js

echo "🔨 Building package..."
npm run build

echo "✅ Running tests..."
npm test

echo "📦 Checking package contents..."
npm pack --dry-run

echo "🚀 Publishing to npm..."
npm publish --access public

echo "✅ Published! Version:"
npm view autoheal-locator-js version

echo "📝 Don't forget to:"
echo "  1. Push to GitHub"
echo "  2. Create GitHub release"
echo "  3. Update CHANGELOG.md"
```

Run it:
```bash
bash publish.sh
```

---

## 🌐 After Publishing

### View on npm
- Visit: `https://www.npmjs.com/package/autoheal-locator-js`
- Or: `https://www.npmjs.com/package/@yourusername/autoheal-locator`

### Install Badge (for README.md)
```markdown
[![npm version](https://badge.fury.io/js/autoheal-locator-js.svg)](https://www.npmjs.com/package/autoheal-locator-js)
```

### Download Stats
```bash
npm info autoheal-locator-js
```

---

## 🔐 Private Registry (Optional)

If you want a private package (like Maven's private repositories):

```bash
# Publish as private
npm publish --access restricted

# Requires paid npm account
```

Or use **GitHub Packages** (free for public repos):
```bash
# Configure .npmrc
echo "@yourusername:registry=https://npm.pkg.github.com" >> .npmrc

# Publish to GitHub Packages
npm publish
```

---

## 🎉 Summary

**To publish to npm (like Maven Central):**

1. Create npm account
2. `npm login`
3. Update package name if needed
4. `npm run build`
5. `npm publish --access public`

**To use in projects:**
```bash
npm install autoheal-locator-js
```

```typescript
import { AutoHealLocator } from 'autoheal-locator-js';
```

**Same as Java:**
- Java: Add to `pom.xml` → `mvn install`
- JavaScript: `npm install autoheal-locator-js`

Both are now distributed via public package registries! 🎉
