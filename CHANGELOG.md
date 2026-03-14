# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.5] - 2026-03-14

### Changed
- **Gemini Model Stability Fix**: Changed default Gemini model from `gemini-2.5-flash` to `gemini-2.0-flash`
  - `gemini-2.5-flash` has JSON response reliability issues in production
  - `gemini-2.0-flash` is the stable, production-ready version
  - Updated in all source files and documentation
  - Provides consistent JSON parsing for vibe-framework integration

### Fixed
- Fixed unreliable JSON responses from Gemini API that caused parsing failures
- Improved stability for command parsing and element healing

## [1.1.4] - 2026-03-14

### Changed
- **Gemini Model Update**: Updated default Gemini model from deprecated `gemini-2.0-flash-exp` to `gemini-2.5-flash`
  - Updated in GeminiAIService.ts
  - Updated in AutoHealConfiguration.ts
  - Updated in AutoHealLocator.ts (both getDefaultModel and getDefaultModelForProvider methods)
  - Updated all documentation (README.md, AI_PROVIDERS.md, GETTING_STARTED.md)
  - Updated examples and configuration files

### Fixed
- Fixed 404 errors when using Gemini API due to deprecated model

## [1.1.0] - 2026-03-13

### Added
- **LOCAL/Custom AI Model Support**: Full support for local AI models (Ollama, LM Studio, etc.)
  - OpenAI-compatible API format
  - Ollama native format support
  - Custom endpoint configuration
  - See [LOCAL_MODEL_SUPPORT.md](docs/LOCAL_MODEL_SUPPORT.md) for details

### Features
- Cloud AI providers: Gemini, OpenAI, Anthropic, DeepSeek, Grok, Groq
- Persistent file-based caching with 24-hour expiration
- Smart sequential execution strategy (DOM → Visual fallback)
- Token usage tracking and reporting
- Comprehensive error handling and retry logic

---

For earlier changes, see git commit history.
