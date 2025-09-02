// Lightweight conditional logger controlled by sessionStorage flag
// Enable at runtime via: sessionStorage.setItem('intent_debug','1')
// Disable via: sessionStorage.removeItem('intent_debug')

export function dlog(...args: unknown[]): void {
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('intent_debug') === '1') {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  } catch {
    // ignore
  }
}


