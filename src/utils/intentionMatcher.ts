/**
 * This is the page responsible for the intention matching logic
 */

import { PageContent } from './scraper';
import { getIntention } from './storage';
import { CONFIG, getOpenRouterHeaders } from './config';
import { getWebsiteCategory } from './domainCategories';

export interface IntentionMatchResult {
  matches: boolean;
  confidence: number; // 0-1 scale
  reasoning: string;
  userIntention: string;
  pageContent: string;
  timestamp: Date;
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
  temperature: CONFIG.OPENROUTER.TEMPERATURE,
  confidenceThreshold: CONFIG.INTENTION_MATCHING.CONFIDENCE_THRESHOLD
};

/**
 * Check if the current page content matches the user's intention
 */
export const checkIntentionMatch = async (
  currentUrl: string,
  options: IntentionMatchOptions = {}
): Promise<IntentionMatchResult> => {
  try {
    // Get user's intention for this URL
    const intentionData = await getIntention(currentUrl);
    if (!intentionData?.intention) {
      return {
        matches: false,
        confidence: 0,
        reasoning: 'No intention statement found for this URL',
        userIntention: '',
        pageContent: '',
        timestamp: new Date()
      };
    }

    // Scrape current page content
// // 
//     let urlCategory = getWebsiteCategory(currentUrl);

//     if (currentUrl )
//     const { scrapeCurrentPage } = await import('./scraper');
    const pageContent = scrapeCurrentPage();
    
    // Prepare content for AI analysis
    const contentForAnalysis = prepareContentForAnalysis(pageContent);
    
    // Merge options with defaults
    const finalOptions = { ...DEFAULT_OPTIONS, ...options };
    
    // Call AI to analyze intention match
    const aiResult = await analyzeIntentionWithAI(
      intentionData.intention,
      contentForAnalysis,
      finalOptions
    );
    
    return {
      matches: aiResult.confidence >= finalOptions.confidenceThreshold!,
      confidence: aiResult.confidence,
      reasoning: aiResult.reasoning,
      userIntention: intentionData.intention,
      pageContent: contentForAnalysis,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('Error checking intention match:', error);
    return {
      matches: false,
      confidence: 0,
      reasoning: `Error analyzing content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      userIntention: '',
      pageContent: '',
      timestamp: new Date()
    };
  }
};

/**
 * Prepare page content for AI analysis
 */
const prepareContentForAnalysis = (pageContent: PageContent): string => {
  const { title, description, relevantText } = pageContent;
  
  // Combine relevant content, prioritizing title and description
  let content = '';
  
  if (title && !isBrowserNoise(title)) {
    content += `Page Title: ${title}\n\n`;
  }
  
  if (description) {
    content += `Page Description: ${description}\n\n`;
  }
  
  if (relevantText) {
    // Take first N characters of main content based on config
    const truncatedContent = relevantText.substring(0, CONFIG.INTENTION_MATCHING.MAX_CONTENT_LENGTH);
    content += `Main Content: ${truncatedContent}`;
  }
  
  return content.trim();
};

/**
 * Check if text is browser noise (helper function)
 */
function isBrowserNoise(text: string): boolean {
  if (!text || text.length < 3) return true;
  
  const noisePatterns = [
    /^[a-zA-Z\s]+\(\d+\)$/, // "youtube (527)", "facebook (3)"
    /^Loading\.{1,3}$/, // "Loading...", "Loading.."
    /^Please wait\.{1,3}$/, // "Please wait..."
    /^Connecting\.{1,3}$/, // "Connecting..."
    /^[A-Za-z\s]+\.{1,3}$/, // Generic loading patterns
    /^\d+$/, // Just numbers
    /^[A-Za-z\s]+\s\(\d+\)$/, // "YouTube (527)" with spaces
    /^[A-Za-z\s]+\s-\s[A-Za-z\s]+$/, // "YouTube - Home" type patterns
    /^[A-Za-z\s]+\s\|\s[A-Za-z\s]+$/, // "YouTube | Home" type patterns
  ];
  
  return noisePatterns.some(pattern => pattern.test(text.trim()));
}

/**
 * Analyze intention match using OpenRouter AI
 */
const analyzeIntentionWithAI = async (
  userIntention: string,
  pageContent: string,
  options: IntentionMatchOptions
): Promise<{ confidence: number; reasoning: string }> => {
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
            content: 'You are an AI assistant that analyzes whether a user\'s intention matches the content they are viewing on a webpage. Provide a confidence score (0-1) and clear reasoning for your assessment.'
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
  return `You are analyzing whether a user's intention aligns with the webpage content they are viewing. Be ROBUST and TOLERANT of noise in the content.

User's Intention: "${userIntention}"

Webpage Content:
${pageContent}

IMPORTANT GUIDELINES:
1. **Be tolerant of noise**: The content may contain browser noise, loading states, or incomplete data. Focus on ANY meaningful content that could align with the intention.
2. **Look for partial matches**: Even if content is limited or noisy, if ANY aspect suggests alignment with the intention, consider it a match.
3. **Consider the domain context**: If the domain/website type aligns with the intention, this is a positive signal.
4. **Default to allowing**: When in doubt, prefer to allow the user to proceed rather than block them.

ANALYSIS APPROACH:
- Look for ANY content that could serve the user's stated goal
- Consider the website type and typical content
- Ignore loading states, browser noise, or incomplete data
- Focus on the essence of the user's intention vs. available content
- If the website type matches the intention category, this is a positive signal

Please provide your analysis in the following JSON format:
{
  "confidence": 0.85,
  "reasoning": "Even though the content shows limited information, this appears to be [website type] which aligns with the user's intention to [goal]. The available content suggests this could serve their stated purpose."
}

Confidence scoring (be generous):
- 0.8-1.0: Clear alignment or website type matches intention
- 0.6-0.7: Good alignment with some relevant content
- 0.4-0.5: Moderate alignment, website type relevant
- 0.2-0.3: Weak alignment but not clearly misaligned
- 0.0-0.1: Only if clearly distracting or completely irrelevant

Remember: It's better to allow a potentially relevant activity than to block a user who might be on the right track.

Respond only with valid JSON.`;
};

/**
 * Parse the AI response to extract confidence and reasoning
 */
const parseAIResponse = (aiResponse: string): { confidence: number; reasoning: string } => {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
        reasoning: parsed.reasoning || 'No reasoning provided'
      };
    }
    
    // Fallback: try to extract confidence from text
    const confidenceMatch = aiResponse.match(/confidence["\s:]*([0-9]*\.?[0-9]+)/i);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;
    
    return {
      confidence: Math.max(0, Math.min(1, confidence)),
      reasoning: aiResponse.replace(/confidence["\s:]*[0-9]*\.?[0-9]+/i, '').trim()
    };
    
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {
      confidence: 0.5,
      reasoning: 'Unable to parse AI response'
    };
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