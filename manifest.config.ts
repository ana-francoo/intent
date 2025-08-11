import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  permissions: ['storage', 'activeTab', 'tabs'],
  optional_host_permissions: ['https://*/src/popup/index#/tour'],
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
  },
          web_accessible_resources: [{
          resources: [
            'src/assets/logo2.png',
            'public/logo.png',
            'src/landing.html',
            'src/landing.js',
            'vendor/*'
          ],
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
