# Intention Matching Utility

This utility provides AI-powered analysis to check if the content of a webpage matches the user's stated intention for visiting that site.

## Features

- **AI-Powered Analysis**: Uses OpenRouter API to analyze webpage content against user intentions
- **Configurable Models**: Support for various AI models (GPT-4, Claude, etc.)
- **Confidence Scoring**: Provides confidence scores (0-1) with detailed reasoning
- **Automatic Content Scraping**: Extracts relevant content from webpages
- **Timeout Protection**: Built-in timeout handling for API calls
- **Error Handling**: Robust error handling and fallback mechanisms

## Setup

### 1. Environment Variables

Set up the following environment variables:

```bash
# Required
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional
SITE_URL=https://your-extension-domain.com
SITE_NAME=Your Extension Name
```

### 2. OpenRouter API Key

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Add it to your environment variables

## Usage

### Basic Usage

```typescript
import { checkIntentionMatch } from './utils/intentionMatcher';

// Check if current page matches user's intention
const result = await checkIntentionMatch(window.location.href);

if (result.matches) {
  console.log('✅ Content aligns with your intention!');
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
} else {
  console.log('⚠️ Content may not align with your intention');
  console.log(`Reasoning: ${result.reasoning}`);
}
```

### Custom Options

```typescript
import { checkIntentionMatch } from './utils/intentionMatcher';

const customOptions = {
  model: 'anthropic/claude-3.5-sonnet',
  maxTokens: 300,
  temperature: 0.1,
  confidenceThreshold: 0.8
};

const result = await checkIntentionMatch(url, customOptions);
```

### Automatic Checking

```typescript
import { setupAutomaticChecking } from './utils/example-usage';

const { startChecking, stopChecking } = setupAutomaticChecking();

// Start automatic checking
startChecking();

// Stop automatic checking
stopChecking();
```

## API Reference

### `checkIntentionMatch(url, options?)`

Checks if the content of a webpage matches the user's intention.

**Parameters:**
- `url` (string): The URL to check
- `options` (IntentionMatchOptions, optional): Custom options for the analysis

**Returns:** `Promise<IntentionMatchResult>`

### `getIntentionSummary(url)`

Gets the user's intention statement for a URL.

**Parameters:**
- `url` (string): The URL to get the intention for

**Returns:** `Promise<string | null>`

### `isIntentionMatchingAvailable()`

Checks if AI features are available (API key configured).

**Returns:** `boolean`

## Configuration

The utility uses a centralized configuration system. Key settings:

```typescript
// OpenRouter Configuration
OPENROUTER: {
  API_KEY: process.env.OPENROUTER_API_KEY,
  DEFAULT_MODEL: 'openai/gpt-4o',
  MAX_TOKENS: 500,
  TEMPERATURE: 0.3,
}

// Intention Matching Configuration
INTENTION_MATCHING: {
  CONFIDENCE_THRESHOLD: 0.7,
  MAX_CONTENT_LENGTH: 1000,
  ANALYSIS_TIMEOUT: 10000,
}
```

## Supported AI Models

The utility supports all models available through OpenRouter, including:

- `openai/gpt-4o` (default)
- `openai/gpt-4-turbo`
- `anthropic/claude-3.5-sonnet`
- `anthropic/claude-3-haiku`
- `google/gemini-pro`
- And many more...

## Error Handling

The utility includes comprehensive error handling:

- **API Key Missing**: Returns error if OpenRouter API key is not configured
- **Network Errors**: Handles network timeouts and connection issues
- **API Errors**: Parses and reports OpenRouter API errors
- **Content Scraping Errors**: Graceful fallback if content extraction fails
- **AI Response Parsing**: Fallback parsing if AI response format is unexpected

## Integration Examples

### Content Script Integration

```typescript
// content-script.ts
import { checkIntentionMatch } from './utils/intentionMatcher';

// Check on page load
document.addEventListener('DOMContentLoaded', async () => {
  const result = await checkIntentionMatch(window.location.href);
  
  if (!result.matches) {
    // Show warning to user
    showIntentionWarning(result);
  }
});
```

### Background Script Integration

```typescript
// background.ts
import { handlePageNavigation } from './utils/example-usage';

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    handlePageNavigation(tab.url);
  }
});
```

### Popup Integration

```typescript
// popup.tsx
import { getIntentionSummary } from './utils/intentionMatcher';

const [intention, setIntention] = useState<string | null>(null);

useEffect(() => {
  const getCurrentIntention = async () => {
    const currentIntention = await getIntentionSummary(currentUrl);
    setIntention(currentIntention);
  };
  
  getCurrentIntention();
}, [currentUrl]);
```

## Performance Considerations

- **Content Length**: Limited to 1000 characters by default to reduce API costs
- **Timeout**: 10-second timeout to prevent hanging requests
- **Caching**: Consider implementing result caching for frequently visited pages
- **Rate Limiting**: Be mindful of OpenRouter API rate limits

## Troubleshooting

### Common Issues

1. **"OpenRouter API key not configured"**
   - Ensure `OPENROUTER_API_KEY` environment variable is set
   - Check that the API key is valid

2. **"AI analysis timed out"**
   - Increase `ANALYSIS_TIMEOUT` in configuration
   - Check network connectivity

3. **"No intention statement found"**
   - User hasn't set an intention for this URL
   - Check if intention was saved correctly

4. **"Unable to parse AI response"**
   - AI model returned unexpected format
   - Check model compatibility

### Debug Mode

Enable debug logging by setting:

```typescript
localStorage.setItem('intention-matcher-debug', 'true');
```

## Security Considerations

- API keys are stored in environment variables, not in client-side code
- Content is truncated to prevent sensitive data exposure
- Timeout protection prevents hanging requests
- Error messages don't expose sensitive information

## Contributing

When contributing to this utility:

1. Follow TypeScript best practices
2. Add comprehensive error handling
3. Include unit tests for new features
4. Update documentation for API changes
5. Consider performance implications 