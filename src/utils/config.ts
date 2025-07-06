// Configuration for the Intent Extension

// Helper function to safely get environment variables
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  try {
    // In browser extensions, process.env is replaced by Vite's define
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
    // Fallback for when process.env is not available or key doesn't exist
    return defaultValue;
  } catch (error) {
    console.warn(`Error getting environment variable ${key}:`, error);
    return defaultValue;
  }
};

// Helper function to get numeric environment variable
const getEnvNumber = (key: string, defaultValue: number): number => {
  try {
    const value = getEnvVar(key, '');
    if (!value) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch (error) {
    console.warn(`Error parsing numeric environment variable ${key}:`, error);
    return defaultValue;
  }
};

export const CONFIG = {
  // OpenRouter AI Configuration
  OPENROUTER: {
    API_KEY: getEnvVar('OPENROUTER_API_KEY', ''),
    SITE_URL: getEnvVar('SITE_URL', 'https://intent-extension.com'),
    SITE_NAME: getEnvVar('SITE_NAME', 'Intent Extension'),
    DEFAULT_MODEL: getEnvVar('OPENROUTER_MODEL', 'mistralai/mistral-small-3.2-24b-instruct:free'),
    MAX_TOKENS: 500,
    TEMPERATURE: 0.3,
  },
  
  // Intention Matching Configuration
  INTENTION_MATCHING: {
    CONFIDENCE_THRESHOLD: getEnvNumber('INTENTION_CONFIDENCE_THRESHOLD', 0.7),
    MAX_CONTENT_LENGTH: 1000, // Max characters to analyze from page content
    ANALYSIS_TIMEOUT: 10000, // 10 seconds timeout for AI analysis
  },
  
  // Storage Configuration
  STORAGE: {
    INTENTION_PREFIX: 'intention_',
    MATCH_RESULT_PREFIX: 'match_result_',
    MAX_STORED_RESULTS: 100, // Maximum number of stored match results
  },
  
  // UI Configuration
  UI: {
    SHOW_CONFIDENCE_SCORE: true,
    SHOW_REASONING: true,
    AUTO_CHECK_ON_NAVIGATION: true,
    CHECK_INTERVAL: 5000, // 5 seconds between checks
  }
};

// Debug logging for configuration
if (typeof window !== 'undefined') {
  console.log('🔧 Intent Extension Configuration:');
  console.log('  - AI Features Enabled:', !!CONFIG.OPENROUTER.API_KEY);
  console.log('  - Site URL:', CONFIG.OPENROUTER.SITE_URL);
  console.log('  - Site Name:', CONFIG.OPENROUTER.SITE_NAME);
  console.log('  - Default Model:', CONFIG.OPENROUTER.DEFAULT_MODEL);
  console.log('  - Confidence Threshold:', CONFIG.INTENTION_MATCHING.CONFIDENCE_THRESHOLD);
}

// Helper function to check if AI features are available
export const isAIFeaturesEnabled = (): boolean => {
  return !!CONFIG.OPENROUTER.API_KEY;
};

// Helper function to get OpenRouter headers
export const getOpenRouterHeaders = () => ({
  'Authorization': `Bearer ${CONFIG.OPENROUTER.API_KEY}`,
  'HTTP-Referer': CONFIG.OPENROUTER.SITE_URL,
  'X-Title': CONFIG.OPENROUTER.SITE_NAME,
  'Content-Type': 'application/json',
});

// Helper function to validate configuration
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!CONFIG.OPENROUTER.API_KEY) {
    errors.push('OPENROUTER_API_KEY is not configured. Please add it to your .env.local file.');
  }
  
  if (CONFIG.INTENTION_MATCHING.CONFIDENCE_THRESHOLD < 0 || CONFIG.INTENTION_MATCHING.CONFIDENCE_THRESHOLD > 1) {
    errors.push('INTENTION_CONFIDENCE_THRESHOLD must be between 0 and 1.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 