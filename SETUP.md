# Setup Guide for Intent Extension

This guide will help you set up the Intent Extension with AI-powered intention matching using OpenRouter.

## 🔑 Environment Variables Setup

### 1. Create Environment File

Create a `.env` file in the root directory of your project:

```bash
# Copy the example file
cp .env.example .env
```

Or create a new `.env` file with the following content:

```env
# OpenRouter API Configuration
# Get your API key from: https://openrouter.ai/
OPENROUTER_API_KEY=your_actual_api_key_here

# Optional: Site configuration for OpenRouter rankings
SITE_URL=https://intent-extension.com
SITE_NAME=Intent Extension

# Optional: Override default AI model
# OPENROUTER_MODEL=openai/gpt-4o

# Optional: Override default confidence threshold (0.0 - 1.0)
# INTENTION_CONFIDENCE_THRESHOLD=0.7
```

### 2. Get OpenRouter API Key

1. **Sign up** at [OpenRouter](https://openrouter.ai/)
2. **Navigate** to your dashboard
3. **Copy** your API key
4. **Replace** `your_actual_api_key_here` in your `.env` file with your real API key

### 3. Verify Setup

Run the following command to verify your configuration:

```bash
npm run dev
```

Check the browser console for any configuration errors.

## 🔒 Security Best Practices

### ✅ Do's

- ✅ Keep your `.env` file in `.gitignore` (already configured)
- ✅ Use different API keys for development and production
- ✅ Regularly rotate your API keys
- ✅ Monitor your OpenRouter usage and costs

### ❌ Don'ts

- ❌ Never commit your `.env` file to version control
- ❌ Don't share your API key publicly
- ❌ Don't hardcode API keys in your source code
- ❌ Don't use the same API key across multiple projects

## 🚀 Configuration Options

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | `sk-or-v1-...` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `SITE_URL` | Your site URL for OpenRouter rankings | `https://intent-extension.com` | `https://myextension.com` |
| `SITE_NAME` | Your site name for OpenRouter rankings | `Intent Extension` | `My Extension` |
| `OPENROUTER_MODEL` | AI model to use | `openai/gpt-4o` | `anthropic/claude-3.5-sonnet` |
| `INTENTION_CONFIDENCE_THRESHOLD` | Confidence threshold (0-1) | `0.7` | `0.8` |

## 🤖 Supported AI Models

You can use any model available through OpenRouter:

### Popular Models

- `openai/gpt-4o` (default) - Best overall performance
- `openai/gpt-4-turbo` - Good balance of speed and quality
- `anthropic/claude-3.5-sonnet` - Excellent reasoning
- `anthropic/claude-3-haiku` - Fast and cost-effective
- `google/gemini-pro` - Good for general tasks

### Cost Considerations

- **GPT-4o**: ~$0.005/1K tokens (input), ~$0.015/1K tokens (output)
- **Claude-3.5-Sonnet**: ~$0.003/1K tokens (input), ~$0.015/1K tokens (output)
- **Claude-3-Haiku**: ~$0.00025/1K tokens (input), ~$0.00125/1K tokens (output)

## 🧪 Testing Your Setup

### 1. Basic Test

```typescript
import { isAIFeaturesEnabled, validateConfig } from './src/utils/config';

// Check if AI features are available
if (isAIFeaturesEnabled()) {
  console.log('✅ AI features are enabled');
} else {
  console.log('❌ AI features are not available');
}

// Validate configuration
const validation = validateConfig();
if (validation.isValid) {
  console.log('✅ Configuration is valid');
} else {
  console.log('❌ Configuration errors:', validation.errors);
}
```

### 2. Test Intention Matching

```typescript
import { checkIntentionMatch } from './src/utils/intentionMatcher';

// Test with a sample URL
const result = await checkIntentionMatch('https://example.com');
console.log('Test result:', result);
```

## 🔧 Troubleshooting

### Common Issues

1. **"OpenRouter API key not configured"**
   - Make sure your `.env` file exists in the project root
   - Verify the API key is correctly set
   - Restart your development server

2. **"AI features not available"**
   - Check that `OPENROUTER_API_KEY` is set in your `.env` file
   - Ensure the API key is valid and active

3. **"Configuration errors"**
   - Run `validateConfig()` to see specific errors
   - Check that all required variables are set

4. **Build errors**
   - Make sure Vite can find your `.env` file
   - Check that the file is in the correct location

### Debug Mode

Enable debug logging by adding to your `.env` file:

```env
DEBUG=true
```

## 📊 Monitoring Usage

### OpenRouter Dashboard

Monitor your usage at [OpenRouter Dashboard](https://openrouter.ai/keys):

- Track API calls and costs
- View usage analytics
- Set up usage alerts
- Monitor rate limits

### Extension Analytics

The extension logs usage information to help you monitor:

- Number of intention checks
- API response times
- Error rates
- Cost estimates

## 🔄 Environment Management

### Development vs Production

For different environments, you can use different `.env` files:

```bash
# Development
.env.development

# Production
.env.production

# Local overrides
.env.local
```

### Team Development

For team development, share a `.env.example` file:

```bash
# Copy your .env to .env.example (remove sensitive data)
cp .env .env.example
# Edit .env.example to remove your actual API key
```

## 📝 Next Steps

After setting up your environment variables:

1. **Test the extension** with a simple intention
2. **Monitor your usage** in the OpenRouter dashboard
3. **Adjust settings** based on your needs
4. **Deploy** when ready

## 🆘 Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review the [OpenRouter documentation](https://openrouter.ai/docs)
3. Check the extension's console logs
4. Verify your API key is active and has sufficient credits 