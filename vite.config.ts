import path from 'node:path';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import zip from 'vite-plugin-zip-pack';
import manifest from './manifest.config.js';
import { name, version } from './package.json';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log('Environment mode:', mode);
  console.log('OpenRouter API Key configured:', !!env.OPENROUTER_API_KEY);
  
  return {
    resolve: {
      alias: {
        '@': `${path.resolve(__dirname, 'src')}`,
      },
    },
    plugins: [
      react(),
      crx({ manifest }),
      zip({ outDir: 'release', outFileName: `crx-${name}-${version}.zip` }),
    ],
    server: {
      cors: {
        origin: [/chrome-extension:\/\//],
      },
    },
    // Define global constants for the extension
    define: {
      // Make environment variables available to the extension
      'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY || ''),
      'process.env.SITE_URL': JSON.stringify(env.SITE_URL || 'https://intent-extension.com'),
      'process.env.SITE_NAME': JSON.stringify(env.SITE_NAME || 'Intent Extension'),
      'process.env.OPENROUTER_MODEL': JSON.stringify(env.OPENROUTER_MODEL || 'openai/gpt-4o'),
      'process.env.INTENTION_CONFIDENCE_THRESHOLD': JSON.stringify(env.INTENTION_CONFIDENCE_THRESHOLD || '0.7'),
    },
  };
});
