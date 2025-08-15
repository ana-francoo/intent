import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'Intent',
  short_name: 'Intent',
  version: pkg.version,
  permissions: ['storage', 'activeTab', 'tabs', 'scripting'],
  host_permissions: ['https://www.google.com/*', 'https://www.google-analytics.com/*'],
  optional_host_permissions: ['https://*/src/popup/index#/tour'],
  externally_connectable: {
    matches: [
      'http://localhost:5173/*',
      'https://useintent.app/*'
    ]
  },
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_title: 'Intent',
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
