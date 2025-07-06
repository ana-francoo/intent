// Web scraping utilities for extracting relevant page content

export interface PageContent {
  title: string;
  description: string;
  url: string;
  domain: string;
  relevantText: string;
  timestamp: Date;
}

/**
 * Extract the most relevant content from the current page
 * Uses semantic weighting to prioritize important content blocks
 * Filters out browser noise and focuses on meaningful content
 */
export function extractRelevantContentFromPage(): string {
  // 1. Collect metadata with noise filtering
  const metadata = [
    document.title,
    (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content,
    (document.querySelector('meta[property="og:title"]') as HTMLMetaElement)?.content,
    (document.querySelector('meta[property="og:description"]') as HTMLMetaElement)?.content,
    (document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement)?.content
  ].filter(Boolean)
  .filter(text => !isBrowserNoise(text)); // Filter out browser noise

  // 2. Define tag weights (semantic signal)
  const tagPriority: Record<string, number> = {
    MAIN: 4,
    ARTICLE: 4,
    SECTION: 3,
    ASIDE: 2,
    DIV: 1,
    P: 2,
    H1: 3,
    H2: 3,
    H3: 2,
    H4: 2,
    H5: 1,
    H6: 1,
    SPAN: 0.5
  };

  // 3. Get visible, long-enough elements with better filtering
  const blocks = Array.from(document.querySelectorAll('main, article, section, aside, div, p, h1, h2, h3, h4, h5, h6, span'))
    .map(el => {
      const style = window.getComputedStyle(el);
      const text = (el as HTMLElement).innerText.trim();
      const isVisible = style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       (el as HTMLElement).offsetHeight > 0 &&
                       style.opacity !== '0';

      return {
        tag: el.tagName,
        text,
        weight: (tagPriority[el.tagName] || 0),
        isVisible,
        length: text.length,
        isNoise: isBrowserNoise(text)
      };
    })
    .filter(el => el.isVisible && el.length > 30 && !el.isNoise) // Increased min length, filter noise
    .sort((a, b) => (b.length * b.weight) - (a.length * b.weight))
    .slice(0, 8) // Top 8 longest + high-weight blocks
    .map(el => el.text);

  // 4. Merge content and truncate
  const combined = [...metadata, ...blocks].join('\n\n');
  return combined.slice(0, 5000); // Limit to ~5k characters for token efficiency
}

/**
 * Check if text is browser noise (like "youtube (527)", "Loading...", etc.)
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
 * Extract comprehensive content from the current page
 * Returns structured data with relevant text content
 */
export const scrapeCurrentPage = (): PageContent => {
  const url = window.location.href;
  const domain = window.location.hostname;
  
  // Get page title with noise filtering
  const rawTitle = document.title || '';
  const title = isBrowserNoise(rawTitle) ? '' : rawTitle;
  
  // Get meta description
  const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
  const description = metaDescription?.content || '';
  
  // Get relevant text content using the improved extraction method
  const relevantText = extractRelevantContentFromPage();
  
  return {
    title,
    description,
    url,
    domain,
    relevantText,
    timestamp: new Date()
  };
};

/**
 * Extract content from a specific URL (for testing purposes)
 * Note: This requires the page to be loaded in the current context
 */
export const scrapePageFromUrl = (url: string): PageContent | null => {
  // Check if we're on the requested URL
  if (window.location.href !== url) {
    console.warn('URL mismatch. Current page URL must match the requested URL for scraping.');
    return null;
  }
  
  return scrapeCurrentPage();
};

/**
 * Get a summary of the page content for quick analysis
 */
export const getPageSummary = (): {
  title: string;
  description: string;
  contentLength: number;
  hasMainContent: boolean;
} => {
  const title = document.title || '';
  const description = (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content || '';
  const relevantText = extractRelevantContentFromPage();
  
  return {
    title,
    description,
    contentLength: relevantText.length,
    hasMainContent: relevantText.length > 100
  };
};

/**
 * Extract content with custom filters
 */
export const extractContentWithFilters = (options: {
  minLength?: number;
  maxBlocks?: number;
  includeMetadata?: boolean;
  customSelectors?: string[];
} = {}): string => {
  const {
    minLength = 50,
    maxBlocks = 5,
    includeMetadata = true,
    customSelectors = []
  } = options;

  // Collect metadata if requested
  const metadata = includeMetadata ? [
    document.title,
    (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content,
    (document.querySelector('meta[property="og:title"]') as HTMLMetaElement)?.content,
    (document.querySelector('meta[property="og:description"]') as HTMLMetaElement)?.content,
    (document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement)?.content
  ].filter(Boolean) : [];

  // Define tag weights
  const tagPriority: Record<string, number> = {
    MAIN: 3,
    ARTICLE: 3,
    SECTION: 2,
    DIV: 1,
    P: 1,
    SPAN: 0.5
  };

  // Build selector list
  const selectors = [
    'main, article, section, div, p, span',
    ...customSelectors
  ].join(', ');

  // Get visible, long-enough elements
  const blocks = Array.from(document.querySelectorAll(selectors))
    .map(el => {
      const style = window.getComputedStyle(el);
      const text = (el as HTMLElement).innerText.trim();
      const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetHeight > 0;

      return {
        tag: el.tagName,
        text,
        weight: (tagPriority[el.tagName] || 0),
        isVisible,
        length: text.length
      };
    })
    .filter(el => el.isVisible && el.length > minLength)
    .sort((a, b) => (b.length * b.weight) - (a.length * a.weight))
    .slice(0, maxBlocks)
    .map(el => el.text);

  // Merge content
  const combined = [...metadata, ...blocks].join('\n\n');
  return combined.slice(0, 5000);
};

/**
 * Test function to demonstrate the scraper functionality
 * Call this from the browser console to test the scraper
 */
export const testScraper = () => {
  console.log('🧪 Testing New Scraper Functionality...');
  
  // Test the main extraction function
  const relevantContent = extractRelevantContentFromPage();
  console.log('📄 Extracted Content Length:', relevantContent.length);
  console.log('📄 First 500 characters:', relevantContent.substring(0, 500));
  
  // Test the structured data
  const pageData = scrapeCurrentPage();
  console.log('📊 Page Data:', pageData);
  
  // Test the summary
  const summary = getPageSummary();
  console.log('📋 Page Summary:', summary);
  
  return {
    relevantContent,
    pageData,
    summary
  };
}; 