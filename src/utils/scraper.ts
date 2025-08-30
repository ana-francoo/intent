import { getWebsiteCategory } from './domainCategories';

export interface PageContent {
  content: string;
}

export function extractRelevantContentFromPage(): string {
  const metadata = [
    document.title,
    (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content,
    (document.querySelector('meta[property="og:title"]') as HTMLMetaElement)?.content,
    (document.querySelector('meta[property="og:description"]') as HTMLMetaElement)?.content,
    (document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement)?.content
  ].filter(Boolean);

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
        length: text.length
      };
    })
    .filter(el => el.isVisible && el.length > 30) // Increased min length, filter noise
    .sort((a, b) => (b.length * b.weight) - (a.length * a.weight))
    .slice(0, 8) // Top 8 longest + high-weight blocks
    .map(el => el.text);

  const combined = [...metadata, ...blocks].join('\n\n');
  return combined.slice(0, 5000);
}

type CustomScraper = (url: URL) => string;

interface ScraperEntry {
  name: string;
  matches: (url: URL) => boolean;
  scrape: CustomScraper;
}

const customScrapers: ScraperEntry[] = [
  {
    name: 'YouTube',
    matches: (u) => u.hostname.replace(/^www\./, '').endsWith('youtube.com'),
    scrape: () => extractYouTubeMetadata(),
  },
  {
    name: 'Reddit',
    matches: (u) => u.hostname.replace(/^www\./, '').endsWith('reddit.com'),
    scrape: () => extractRedditMetadata(),
  },
  {
    name: 'Pinterest',
    matches: (u) => u.hostname.replace(/^www\./, '').endsWith('pinterest.com'),
    scrape: () => extractPinterestSearchQuery(),
  },
];

function findCustomScraper(urlObj: URL): ScraperEntry | null {
  return customScrapers.find(entry => entry.matches(urlObj)) || null;
}

interface ScrapeCache {
  url: string;
  title: string;
  metaDescription: string;
  content: string;
  contentLength: number;
  timestamp: number;
}

let previousScrapeCache: ScrapeCache | null = null;

export const scrapeCurrentPage = (): PageContent => { // certain categories may skip scraping; identified before
  const href = window.location.href;
  const urlObj = new URL(href);
  const category = getWebsiteCategory(href);

  let usedScraper: string = 'generic';
  let content = '';

  const custom = findCustomScraper(urlObj);
  if (custom) {
    try {
      content = custom.scrape(urlObj) || '';
      usedScraper = custom.name;
    } catch (e) {
      console.warn(`⚠️ Custom scraper failed for ${custom.name}, falling back to category/generic`, e);
      content = '';
      usedScraper = `${custom.name}-failed`;
    }
  }

  if (!content) {
    if (category === 'news') {
      usedScraper = 'newsTitle';
      content = extractNewsTitle();
    } else if (category === 'social' || category === 'shopping' || category === 'entertainment') {
      // Social/entertainment may still need some text; doom-scrolling is handled elsewhere
      usedScraper = `category-${category}`;
      content = extractRelevantContentFromPage();
    }
  }

  if (!content) {
    usedScraper = 'generic-fallback';
    content = extractRelevantContentFromPage();
  }

  const relevantText = extractRelevantContentFromPage();
  console.log('🧲 scrapeCurrentPage', {
    url: href,
    category,
    usedScraper,
    contentLength: content?.length || 0,
    contentPreview: (content || '').slice(0, 300),
    relevantTextLen: relevantText.length
  });

  return { content };
};

const extractPageMetadata = (): { title: string; metaDescription: string } => {
  const title = document.title || '';
  const metaDescription = (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content || 
                          (document.querySelector('meta[property="og:description"]') as HTMLMetaElement)?.content || '';
  return { title, metaDescription };
};

export const scrapeCurrentPageWithRetry = async (maxRetries: number = 3): Promise<PageContent> => {
  const href = window.location.href;
  console.log('🔄 scrapeCurrentPageWithRetry: starting', { url: href, maxRetries });
  
  const urlChanged = previousScrapeCache && previousScrapeCache.url !== href;
  
  if (urlChanged) {
    console.log('⏳ URL changed, waiting 500ms for DOM to update...');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  let attempt = 0;
  const waitTimes = [500, 750, 1000];
  
  while (attempt < maxRetries) {
    attempt++;
    console.log(`🔍 Scrape attempt ${attempt}/${maxRetries}`);
    
    const result = scrapeCurrentPage();
    const content = result.content || '';
    const metadata = extractPageMetadata();
    
    const isContentEmpty = !content || content === 'blank' || content.length < 50;
    
    // for some reason the title may change, but the metadata does not 
    // so this is an indication that the new page is still loading and the metadata is stale
    const prevTitleGeneric = previousScrapeCache && (
      previousScrapeCache.title === 'YouTube' ||
      previousScrapeCache.title.length < 20
    );
    
    const isMetadataStale = urlChanged && previousScrapeCache && (
      (previousScrapeCache.title === metadata.title && 
       previousScrapeCache.metaDescription === metadata.metaDescription &&
       previousScrapeCache.url !== href) ||
      (prevTitleGeneric && 
       href.includes(new URL(previousScrapeCache.url).hostname) &&
       previousScrapeCache.url !== href)
    );
    
    const contentLengthChange = previousScrapeCache ? 
      Math.abs(content.length - previousScrapeCache.contentLength) / previousScrapeCache.contentLength : 0;
    const isDrasticallyDifferent = contentLengthChange > 0.5;
    
    if (urlChanged && previousScrapeCache) {
      console.log('📊 Comparing with previous scrape:', {
        prevUrl: previousScrapeCache.url.split('?')[0], // Log without query params for clarity
        prevTitle: previousScrapeCache.title.slice(0, 50),
        currTitle: metadata.title.slice(0, 50),
        titleMatch: previousScrapeCache.title === metadata.title,
        descMatch: previousScrapeCache.metaDescription === metadata.metaDescription,
        lengthChange: `${(contentLengthChange * 100).toFixed(1)}%`,
        prevTitleGeneric: prevTitleGeneric
      });
    }
    
    const shouldRetry = isContentEmpty || 
                       (isMetadataStale && attempt < 2) ||  // Always retry at least once if metadata is stale
                       (isMetadataStale && !isDrasticallyDifferent);  // Continue retrying if not drastically different
    
    if (shouldRetry) {
      console.log(`⚠️ Stale content detected`, { 
        empty: isContentEmpty,
        metadataStale: isMetadataStale,
        drasticallyDifferent: isDrasticallyDifferent,
        contentLength: content.length 
      });
      
      if (attempt < maxRetries) {
        const waitTime = waitTimes[attempt - 1] || 1000;
        console.log(`⏳ Waiting ${waitTime}ms before retry (exponential backoff)...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
    }
    
    previousScrapeCache = {
      url: href,
      title: metadata.title,
      metaDescription: metadata.metaDescription,
      content: content,
      contentLength: content.length,
      timestamp: Date.now()
    };
    
    console.log('✅ Scraping successful', { 
      attempt, 
      contentLength: content.length,
      title: metadata.title.slice(0, 50),
      preview: content.slice(0, 100) 
    });
    
    return result;
  }
  
  // Max retries reached - update cache anyway to prevent infinite loops
  const finalResult = scrapeCurrentPage();
  const finalMetadata = extractPageMetadata();
  
  previousScrapeCache = {
    url: href,
    title: finalMetadata.title,
    metaDescription: finalMetadata.metaDescription,
    content: finalResult.content || '',
    contentLength: (finalResult.content || '').length,
    timestamp: Date.now()
  };
  
  console.warn('⚠️ Max retries reached, accepting current content');
  return finalResult;
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


////////////////CUSTOM SCRAPERS//////////////////////

//Youtube specific scraper
export function extractYouTubeMetadata(): string {
  console.log('🧩 extractYouTubeMetadata: invoked');
  
  // Try to get title from various sources (DOM elements are more reliable for SPAs)
  let title = '';
  
  // 1. Try YouTube's video title element (most reliable for current video)
  const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer') ||
                      document.querySelector('h1.title') ||
                      document.querySelector('yt-formatted-string.ytd-video-primary-info-renderer') ||
                      document.querySelector('#title h1') ||
                      document.querySelector('h1[class*="title"]');
  
  if (titleElement) {
    title = titleElement.textContent?.trim() || '';
    console.log('📺 Found YouTube title from DOM element:', title.slice(0, 50));
  }
  
  // 2. Fallback to meta tags if DOM elements not found
  if (!title) {
    title = document.querySelector('meta[name="title"]')?.getAttribute('content') ||
           document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
           document.title || '';
    console.log('📺 Using meta/title tag:', title.slice(0, 50));
  }
  
  // Try to get description
  let description = '';
  
  // 1. Try to get from video description area (expandable section)
  const descElement = document.querySelector('#description-inline-expander') ||
                     document.querySelector('ytd-expander.ytd-video-secondary-info-renderer') ||
                     document.querySelector('#description');
  
  if (descElement) {
    description = descElement.textContent?.trim() || '';
    console.log('📺 Found description from DOM:', description.slice(0, 50));
  }
  
  // 2. Fallback to meta description
  if (!description) {
    description = document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                 document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                 '';
  }
  
  // Get channel name if available
  const channelElement = document.querySelector('#channel-name a') ||
                        document.querySelector('ytd-channel-name a') ||
                        document.querySelector('a.ytd-video-owner-renderer');
  const channel = channelElement?.textContent?.trim() || '';

  const result = `title: ${title.trim()}${channel ? `\nchannel: ${channel}` : ''}\ndescription: ${description.trim()}`;
  
  console.log('📺 YouTube scrape result length:', result.length);
  return result || 'blank';
}

//Reddit specific scraper
export function extractRedditMetadata(): string {
  console.log('🧩 extractRedditMetadata: invoked');
  const title = document.querySelector('h1[id*="post-title"]')?.textContent?.trim() || 'No title found';

  const description = Array.from(
    document.querySelector('[property="schema:articleBody"]')?.querySelectorAll('p') || []
  )
    .map(p => p.textContent?.trim())
    .filter(Boolean)
    .join('\n\n') || '';

    if (!title && !description) {
      return 'blank';
    }

  return `title: ${title}\ndescription: ${description}`;
}


//

export function extractNewsTitle(): string {
  console.log('🧩 extractNewsTitle: invoked');
  // Priority 1: Standard <meta> tags
  const metaTitle =
    document.querySelector('meta[property="og:title"]')?.getAttribute('content');

  // Priority 2: Document title tag
  const docTitle = document.title;

  // Priority 3: First <h1> tag (commonly used for article headlines)
  const h1Title = document.querySelector('h1')?.textContent?.trim();

  // Final decision logic
  const title = metaTitle?.trim() || h1Title || docTitle?.trim() || '';

  return title ? `title: ${title}` : 'blank';
}


export function extractPinterestSearchQuery(): string {
  console.log('🧩 extractPinterestSearchQuery: invoked');
  // If user is on the Pinterest homepage with no path, check for doomscrolling
  // Note: doomscrolling detection handled by IntentionMonitor

  // Try to extract from the search input field
  const searchInputEl = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement | null;
  const inputValue = searchInputEl?.value?.trim() || '';

  if(inputValue === ''){
    return 'blank';
  }

  
  // Decide final value
  const search = inputValue;

  return search ? `search: ${search}` : 'blank';
}
