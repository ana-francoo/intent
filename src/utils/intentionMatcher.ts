/**
 * This is the page responsible for the intention matching logic
 */

import { PageContent } from './scraper';
import { getIntention } from './storage';
import { CONFIG, getOpenRouterHeaders } from './config';


export interface IntentionMatchResult {
  match: boolean; // will remove confidence score for now, can reimplement again in the future as future feature
}

export interface IntentionMatchOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  confidenceThreshold?: number;
}

/**
 * Default options for intention matching
 */
const DEFAULT_OPTIONS: IntentionMatchOptions = {
  model: CONFIG.OPENROUTER.DEFAULT_MODEL,
  maxTokens: CONFIG.OPENROUTER.MAX_TOKENS,
  temperature: CONFIG.OPENROUTER.TEMPERATURE
};

/**
 * Check if the current page content matches the user's intention
 */
export const checkIntentionMatch = async ( //FYI - logic of only processing content where theres stuff to be scraped (aka no doomscrolling) is handled on the function call side - this is onyl called for non 'social' ctaegories in the intentionMonitoring file
  currentUrl: string,
  options: IntentionMatchOptions = {}
): Promise<IntentionMatchResult> => {
  try {
    // Get user's intention for this URL



    // is this neccesary? checkIntentionmatch should not be called if intention is not set for this url


    const intentionData = await getIntention(currentUrl);
    if (!intentionData?.intention) { //return false immediately if no associated saved intention to this url
      return {
        match: false
      };
    }

    // Scrape current page content
// // 
//     let urlCategory = getWebsiteCategory(currentUrl);

//     if (currentUrl )
    const { scrapeCurrentPage } = await import('./scraper');
    const contentForAnalysis = scrapeCurrentPage(); //dynamically returns content depending on w
    
    // Merge options with defaults
    const finalOptions = { ...DEFAULT_OPTIONS, ...options };
    
    // Call AI to analyze intention match
    const aiResult = await analyzeIntentionWithAI(
      intentionData.intention,
      contentForAnalysis,
      finalOptions
    );
    
    return {
      match: aiResult.
    };
    
  } catch (error) {
    console.error('Error checking intention match:', error);
    return {
      match: true; //CURRENTLY HAVE ERROR DEFAULTING TO TRUE 
    };
  }
};


/**
 * Analyze intention match using OpenRouter AI
 */
const analyzeIntentionWithAI = async (
  userIntention: string,
  pageContent: string,
  options: IntentionMatchOptions
): Promise<{ match: boolean }> => {
  if (!CONFIG.OPENROUTER.API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const prompt = createAnalysisPrompt(userIntention, pageContent);
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.INTENTION_MATCHING.ANALYSIS_TIMEOUT);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: getOpenRouterHeaders(),
      body: JSON.stringify({
        model: options.model,
        messages: [
          {
            role: 'system',
            content: `You are an AI that determines whether a user's intention aligns with a short snippet of webpage content.

Be SEMANTIC and TOLERANT:
- If the content could plausibly help the user achieve their goal, return match: true.
- If the content is clearly irrelevant, return match: false.

Reply only with:
{ "match": true } or { "match": false }`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens,
        temperature: options.temperature,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI model');
    }

    return parseAIResponse(aiResponse);
    
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI analysis timed out');
    }
    throw error;
  }
};

/**
 * Create the analysis prompt for the AI
 */
const createAnalysisPrompt = (userIntention: string, pageContent: string): string => {
  return `Intention:${userIntention},Content:${pageContent}`
};

/**
 * Parse the AI response to extract confidence and reasoning
 */
const parseAIResponse = (aiResponse: string): { match: boolean } => {
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { match: Boolean(parsed.match) };
    }
    // Fallback: attempt loose check
    if (/true/i.test(aiResponse)) return { match: true };
    if (/false/i.test(aiResponse)) return { match: false };
    return { match: false };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return { match: false };
  }
};


/**
 * Get a summary of the user's intention for display
 */
export const getIntentionSummary = async (url: string): Promise<string | null> => {
  try {
    const intentionData = await getIntention(url);
    return intentionData?.intention || null;
  } catch (error) {
    console.error('Error getting intention summary:', error);
    return null;
  }
};

/**
 * Check if intention matching is available (API key configured)
 */
export const isIntentionMatchingAvailable = (): boolean => {
  return !!CONFIG.OPENROUTER.API_KEY;
}; 





/////////////////INTENTION VALIDITY CHECK///////////

//prompt that defined validity of input intention. Can be changed later based on feedbacl

const createValidityPrompt = (intentionText: string): string => {
  return `You are a focus assistant. Users must declare a valid reason to access a blocked site. A valid input must:
- Be specific and clear.
- Express a goal-oriented or intentional use.
- Avoid vague, low-effort, or unserious responses.
- Not describe compulsive, passive, or addictive behavior.

Input: "${intentionText}"

Is this a valid intention? Respond in a succinct way. If valid, reply with "Valid". If invalid, reply with "Invalid" and a short reason.`;
};













// Validate an intention statement. Returns [isValid, reason].
export const validateIntention = async (intentionText: string): Promise<[boolean, string]> => {
  if (!CONFIG.OPENROUTER.API_KEY) {
    // Fallback: always valid if no API key
    return [true, ''];
  }

  const prompt = createValidityPrompt(intentionText);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: getOpenRouterHeaders(),
      body: JSON.stringify({
        model: CONFIG.OPENROUTER.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an empowering focus assistant that determines if a user\'s intention for accessing a blocked site is valid. Only respond with "Valid" or "Invalid", and if invalid, give a short reason that encourages the user to try again.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content?.trim() || '';

    // Parse the AI's response
    if (aiResponse.toLowerCase().startsWith('valid')) {
      return [true, ''];
    } else if (aiResponse.toLowerCase().startsWith('invalid')) {
      // Extract the reason after "Invalid"
      const reason = aiResponse.replace(/^invalid[:,]?\s*/i, '');
      return [false, reason || 'Your intention is not valid.'];
    } else {
      // Fallback: treat as valid if unclear
      return [true, ''];
    }
  } catch (error) {
    console.error('Error validating intention:', error);
    // On error, fallback to valid to avoid blocking user
    return [true, ''];
  }
};