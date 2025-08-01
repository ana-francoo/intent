import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  permissions: ['storage', 'activeTab'],
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
          web_accessible_resources: [{
          resources: ['src/assets/logo2.png', 'public/logo.png', 'src/landing.html', 'src/landing.js'],
          matches: ['https://*/*']
        }],
  background: {
    service_worker: 'src/background.ts',
  },
  content_scripts: [
    {
      js: ['src/content/earlyInterceptor.ts'],
      matches: ['https://*/*'],
      run_at: 'document_start'
    },
    {
      js: ['src/content/main.tsx'],
      matches: ['https://*/*'],
      run_at: 'document_end'
    }
  ]
 
})
