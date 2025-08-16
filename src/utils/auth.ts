import { supabase } from '../supabaseClient';

export async function checkExistingSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Auth] Error getting session:', error);
      return null;
    }
    
    if (session) {
      console.log('[Auth] Session found:', session.user?.email);
      return session;
    }
    
    console.log('[Auth] No existing session found');
    return null;
  } catch (error) {
    console.error('[Auth] Error checking session:', error);
    return null;
  }
}

// Session storage is handled entirely by Supabase via the Chrome storage adapter

export function getAuthRedirectUrl() {
  const isDev = import.meta.env.DEV;
  const baseUrl = isDev ? 'http://localhost:5173' : 'https://useintent.app';
  return `${baseUrl}/auth-callback`;
}

export function openAuthTab(provider: 'google' | 'email', additionalParams?: Record<string, string>) {
  const redirectUrl = getAuthRedirectUrl();
  const params = new URLSearchParams({
    provider,
    extension: 'true',
    ...additionalParams
  });
  
  const authUrl = provider === 'google' 
    ? `${redirectUrl.replace('/auth-callback', '/login')}?${params}`
    : `${redirectUrl}?${params}`;
  // Do not force a new tab; open in the current context
  try {
    window.location.href = authUrl;
  } catch {
    // Fallback only if navigation fails
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: authUrl });
    }
  }
}