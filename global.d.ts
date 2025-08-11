//declaring just os theres inst an issue iwht optional host permissions in the manifest dile
declare module '@crxjs/vite-plugin' {
    interface ManifestV3Options {
      optional_host_permissions?: string[];
    }
  }
  