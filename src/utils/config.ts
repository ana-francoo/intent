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
    PROXY_URL: getEnvVar('OPENROUTER_PROXY_URL', 'https://useintent.app/api/openrouter'),
    DEFAULT_MODEL: getEnvVar('OPENROUTER_MODEL', 'mistralai/mistral-small-3.2-24b-instruct:free'),
    MAX_TOKENS: 12,
    TEMPERATURE: 0.0,
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

// Configuration loaded

// Helper function to check if AI features are available
export const isAIFeaturesEnabled = (): boolean => {
  return !!CONFIG.OPENROUTER.PROXY_URL;
};

// Helper function to validate configuration
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!CONFIG.OPENROUTER.PROXY_URL) {
    errors.push('OPENROUTER_PROXY_URL is not configured.');
  }
  
  if (CONFIG.INTENTION_MATCHING.CONFIDENCE_THRESHOLD < 0 || CONFIG.INTENTION_MATCHING.CONFIDENCE_THRESHOLD > 1) {
    errors.push('INTENTION_CONFIDENCE_THRESHOLD must be between 0 and 1.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 