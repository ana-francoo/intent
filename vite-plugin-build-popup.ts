import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export default function buildPopupPlugin(): Plugin {
  return {
    name: 'build-popup-html',
    
    // Hook into the build process
    generateBundle() {
      // Ensure the popup HTML is included as a web accessible resource
      // CRXJS will handle copying it to the dist folder
      const popupPath = path.resolve(__dirname, 'src/popup/landing.html');
      
      if (fs.existsSync(popupPath)) {
        console.log('✓ Popup HTML found at:', popupPath);
      } else {
        console.warn('⚠ Popup HTML not found at:', popupPath);
      }
    },
    
    // Ensure the HTML is treated as an asset
    buildStart() {
      this.addWatchFile(path.resolve(__dirname, 'src/popup/landing.html'));
    }
  };
}