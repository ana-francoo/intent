/**
 * This is the page responsible for the intention matching logic
 */

// Removed unused PageContent import
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


    console.log('🧩 checkIntentionMatch.start', { currentUrl });
    const intentionData = await getIntention(currentUrl);
    if (!intentionData?.intention) { //return false immediately if no associated saved intention to this url
      console.warn('⚠️ No intention found for URL in checkIntentionMatch', { currentUrl });
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
    const contentPreview = contentForAnalysis?.content?.slice(0, 300) || '';
    console.log('📝 Scraped content (preview, len):', {
      length: contentForAnalysis?.content?.length || 0,
      preview: contentPreview
    });
    
    // Merge options with defaults
    const finalOptions = { ...DEFAULT_OPTIONS, ...options };
    
    // Call AI to analyze intention match
    console.log('🤖 Invoking AI analysis', {
      model: finalOptions.model,
      maxTokens: finalOptions.maxTokens,
      temperature: finalOptions.temperature,
      intentionPreview: intentionData.intention.slice(0, 160)
    });
    const aiResult = await analyzeIntentionWithAI(
      intentionData.intention,
      contentForAnalysis.content,
      finalOptions
    );
    console.log('📥 AI analysis result', aiResult);
    
    return {
      match: aiResult.match
    };
    
  } catch (error) {
    console.error('❌ Error checking intention match:', error);
    return {
      match: true //CURRENTLY HAVE ERROR DEFAULTING TO TRUE 
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
  console.log('🧠 AI prompt length', { promptLength: prompt.length });
  
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
    console.log('🧾 Raw AI response:', aiResponse);
    
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
      console.log('📦 Parsed AI JSON:', parsed);
      return { match: Boolean(parsed.match) };
    }
    // Fallback: attempt loose check
    if (/true/i.test(aiResponse)) return { match: true };
    if (/false/i.test(aiResponse)) return { match: false };
    console.warn('⚠️ Could not parse AI response, defaulting to match=false');
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

// Validate an intention statement. Returns [isValid, reason].
export const validateIntention = async (intentionText: string): Promise<(boolean)> => {
  console.log('🔍 validateIntention called with:', intentionText);
  console.log('🔑 API Key configured:', !!CONFIG.OPENROUTER.API_KEY);
  
  if (!CONFIG.OPENROUTER.API_KEY) {
    console.log('❌ No API key configured, returning invalid');
    return (false);
  }

  try {
    console.log('🌐 Making API request to OpenRouter...');
    const requestBody = {
      model: CONFIG.OPENROUTER.DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            `You decide if a user intention is valid: specific, goal-driven, not vague. Only respond with a strict JSON object:\n` +
            `{ "valid": true }\n` +
            `or\n` +
            `{ "valid": false}`
        },
        {
          role: 'user',
          content: `Is this intention valid: "${intentionText}"`
        }
      ],
      max_tokens: 12,
      temperature: 0.0,
    };
    console.log('📤 Request body:', requestBody);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: getOpenRouterHeaders(),
      body: JSON.stringify(requestBody),
    });

    console.log('📡 Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API response error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📥 API response data:', data);
    const aiResponse = data.choices[0]?.message?.content?.trim() || '';
    console.log('🤖 AI response:', aiResponse);

    // Parse the expected JSON response
    console.log('🔍 Parsing AI response...');
    const match = aiResponse.match(/\{[\s\S]*\}/);
    if (match) {
      console.log('📋 Found JSON match:', match[0]);
      const parsed = JSON.parse(match[0]);
      console.log('📊 Parsed JSON:', parsed);
      if (parsed.valid === true) {
        console.log('✅ AI determined intention is valid');
        return true;
      } else if (parsed.valid === false) {
        console.log('❌ AI determined intention is invalid:', parsed.reason);
        return false;
      }
    }

    console.log('⚠️ No valid JSON found in AI response, treating as invalid');
    // Fallback: treat as invalid if format is off
    return false;
  } catch (error) {
    console.error('❌ Error validating intention:', error);
    console.log('🔄 Returning invalid due to error');
    return false;
  }
};
