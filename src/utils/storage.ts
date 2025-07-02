import { supabase } from '../supabaseClient';

export const saveIntention = async (url: string, intentionText: string) => {
  const data = {
    [url]: {
      intention: intentionText,
      timestamp: Date.now()
    }
  };
  await chrome.storage.local.set(data);
};

export const getIntention = async (url: string) => {
  const result = await chrome.storage.local.get(url);
  return result[url] || null;
};

export const saveBlockedSites = async (urls: string[]) => {
  try {
    const { data, error } = await supabase
      .from('blocked_sites')
      .insert(
        urls.map(url => ({ url }))
      );
    
    if (error) {
      console.error('Error saving blocked sites:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to save blocked sites:', error);
    throw error;
  }
};

export const getBlockedSites = async () => {
  try {
    const { data, error } = await supabase
      .from('blocked_sites')
      .select('url');
    
    if (error) {
      console.error('Error fetching blocked sites:', error);
      throw error;
    }
    
    return data?.map(item => item.url) || [];
  } catch (error) {
    console.error('Failed to fetch blocked sites:', error);
    return [];
  }
};

export const isUrlBlocked = async (currentUrl: string) => {
  try {
    const blockedSites = await getBlockedSites();
    
    // Check if current URL matches any blocked site
    return blockedSites.some(blockedUrl => {
      // Convert URLs to domain for comparison
      const currentDomain = new URL(currentUrl).hostname;
      const blockedDomain = new URL(blockedUrl).hostname;
      
      return currentDomain === blockedDomain || currentUrl.includes(blockedDomain);
    });
  } catch (error) {
    console.error('Error checking if URL is blocked:', error);
    return false;
  }
};