import { supabase } from '../supabaseClient';

export async function checkExistingSession() {
  try {
    const storageData = await chrome.storage.local.get('supabase.auth.token');
    
    if (storageData['supabase.auth.token']) {
      const sessionData = JSON.parse(storageData['supabase.auth.token']);
      
      if (sessionData.expiresAt && sessionData.expiresAt > Date.now()) {
        const { currentSession } = sessionData;
        
        if (currentSession?.access_token && currentSession?.refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token,
          });
          
          if (!error && data.session) {
            console.log('[Auth] Session restored from storage');
            return data.session;
          }
        }
      }
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      await saveSessionToStorage(session);
      console.log('[Auth] Session found in Supabase');
      return session;
    }
    
    console.log('[Auth] No existing session found');
    return null;
  } catch (error) {
    console.error('[Auth] Error checking session:', error);
    return null;
  }
}

export async function saveSessionToStorage(session: any) {
  const sessionData = {
    'supabase.auth.token': JSON.stringify({
      currentSession: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: session.user,
      },
      expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour expiry
    })
  };
  
  await chrome.storage.local.set(sessionData);
  console.log('[Auth] Session saved to storage');
}

export async function clearSessionFromStorage() {
  await chrome.storage.local.remove('supabase.auth.token');
  console.log('[Auth] Session cleared from storage');
}

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