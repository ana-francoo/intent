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
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log('Environment mode:', mode);
  console.log('OpenRouter Proxy URL configured:', !!env.OPENROUTER_PROXY_URL);
  console.log('Supabase URL configured:', !!env.VITE_SUPABASE_URL);
  console.log('Supabase Key configured:', !!env.VITE_SUPABASE_ANON_KEY);
  
  return {
    base: './',
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
          // Reduce WebSocket errors for extensions
        skipErrorOverlay: true,
      },
    },
    define: {
      'process.env.OPENROUTER_PROXY_URL': JSON.stringify(env.OPENROUTER_PROXY_URL || 'https://useintent.app/api/openrouter'),
      'process.env.OPENROUTER_MODEL': JSON.stringify(env.OPENROUTER_MODEL || 'mistralai/mistral-small-3.2-24b-instruct:free'),
      'process.env.INTENTION_CONFIDENCE_THRESHOLD': JSON.stringify(env.INTENTION_CONFIDENCE_THRESHOLD || '0.7'),
      'process.env.VITE_STRIPE_YEARLY_PRICE_ID': JSON.stringify(env.VITE_STRIPE_YEARLY_PRICE_ID || ''),
    },
    // Vite automatically exposes VITE_ prefixed variables to the client
    envPrefix: ['VITE_'],
  };
});
