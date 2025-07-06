# Intent Extension

A Chrome extension that helps users stay focused on their intentions when browsing the web. Features AI-powered intention matching using OpenRouter to analyze whether webpage content aligns with user goals.

## Features

- **AI-Powered Intention Matching**: Uses OpenRouter API to analyze webpage content against user intentions
- **Flame Animation**: Beautiful animated flame component for visual feedback
- **Intention Setting**: Set intentions for specific websites
- **Content Analysis**: Automatic analysis of webpage content
- **Confidence Scoring**: Provides confidence scores with detailed reasoning
- **Configurable AI Models**: Support for GPT-4, Claude, Gemini, and other models

## Quick Start

### 1. Environment Setup

First, set up your environment variables for AI features:

```bash
# Create environment file
cp .env.example .env

# Edit .env file with your OpenRouter API key
# Get your API key from: https://openrouter.ai/
```

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Load Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` directory

### 5. Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Flame.tsx       # Animated flame component
│   ├── Home.tsx        # Main home page
│   └── ...
├── utils/              # Utility functions
│   ├── intentionMatcher.ts  # AI-powered intention matching
│   ├── config.ts       # Configuration management
│   ├── storage.ts      # Data storage utilities
│   └── scraper.ts      # Web content scraping
├── popup/              # Extension popup UI
├── content/            # Content scripts
└── assets/             # Static assets
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Required
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional
SITE_URL=https://intent-extension.com
SITE_NAME=Intent Extension
OPENROUTER_MODEL=openai/gpt-4o
INTENTION_CONFIDENCE_THRESHOLD=0.7
```

### AI Models

The extension supports all models available through OpenRouter:

- `openai/gpt-4o` (default)
- `openai/gpt-4-turbo`
- `anthropic/claude-3.5-sonnet`
- `anthropic/claude-3-haiku`
- `google/gemini-pro`

## Usage

### Setting Intentions

1. Navigate to a website you want to set an intention for
2. Click the extension icon
3. Enter your intention for visiting this site
4. The extension will analyze content against your intention

### AI Analysis

The extension automatically:
- Scrapes webpage content
- Compares it against your intention
- Provides confidence scores and reasoning
- Shows warnings when content doesn't align

## Development

### Tech Stack

- **React** with TypeScript
- **Vite** build tool
- **CRXJS** Vite plugin for Chrome extensions
- **OpenRouter** for AI model access
- **Chrome Extension APIs**

### Key Utilities

- `intentionMatcher.ts`: AI-powered content analysis
- `config.ts`: Environment and configuration management
- `storage.ts`: Chrome storage utilities
- `scraper.ts`: Web content extraction

## Security

- API keys are stored in `.env` files (not committed to git)
- Content is truncated to prevent sensitive data exposure
- Timeout protection prevents hanging requests
- Error messages don't expose sensitive information

## Documentation

- [Setup Guide](./SETUP.md) - Detailed environment setup
- [Utils Documentation](./src/utils/README.md) - API documentation
- [React Documentation](https://reactjs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [CRXJS Documentation](https://crxjs.dev/vite-plugin)
- [OpenRouter Documentation](https://openrouter.ai/docs)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
