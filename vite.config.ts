//import path from 'node:path';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import zip from 'vite-plugin-zip-pack';
import manifest from './manifest.config.js';
import { name, version } from './package.json';
import path from "path";
import tailwindcss from '@tailwindcss/vite'


export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log('Environment mode:', mode);
  console.log('OpenRouter API Key configured:', !!env.OPENROUTER_API_KEY);
  console.log('Supabase URL configured:', !!env.VITE_SUPABASE_URL);
  console.log('Supabase Key configured:', !!env.VITE_SUPABASE_ANON_KEY);
  
  return {
    resolve: {
      alias: {
        '@': `${path.resolve(__dirname, './src')}`,
      },
    },
    plugins: [
      react(),
      crx({ manifest }),
      zip({ outDir: 'release', outFileName: `crx-${name}-${version}.zip` }),
      tailwindcss()
    ],
    server: {
      cors: {
        origin: [/chrome-extension:\/\//],
      },
      hmr: {
        port: 5173,
        host: 'localhost',
      },
    },

    // Define global constants for the extension
    define: {
      // Make environment variables available to the extension
      'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY || ''),
      'process.env.SITE_URL': JSON.stringify(env.SITE_URL || 'https://intent-extension.com'),
      'process.env.SITE_NAME': JSON.stringify(env.SITE_NAME || 'Intent Extension'),
      'process.env.OPENROUTER_MODEL': JSON.stringify(env.OPENROUTER_MODEL || 'mistralai/mistral-small-3.2-24b-instruct:free'),
      'process.env.INTENTION_CONFIDENCE_THRESHOLD': JSON.stringify(env.INTENTION_CONFIDENCE_THRESHOLD || '0.7'),
      'process.env.VITE_STRIPE_YEARLY_PRICE_ID': JSON.stringify(env.VITE_STRIPE_YEARLY_PRICE_ID || ''),
    },
    // Vite automatically exposes VITE_ prefixed variables to the client
    envPrefix: ['VITE_'],
  };
});
