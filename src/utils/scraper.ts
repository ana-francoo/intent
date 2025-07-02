//page to be updated to use scraper library

// Web scraping utilities for extracting page content

export interface PageContent {
  title: string;
  description: string;
  url: string;
  domain: string;
  textContent: string;
  images: string[];
  links: string[];
  timestamp: Date;
}

/**
 * Extract comprehensive content from the current page
 */
export const scrapeCurrentPage = (): PageContent => {
  const url = window.location.href;
  const domain = window.location.hostname;
  
  // Get page title
  const title = document.title || '';
  
  // Get meta description
  const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
  const description = metaDescription?.content || '';
  
  // Get main text content (excluding scripts, styles, etc.)
  const textContent = extractMainTextContent();
  
  // Get all images
  const images = extractImages();
  
  // Get all links
  const links = document.querySelectorAll('a[href]');
  const linkUrls: string[] = [];
  
  links.forEach(link => {
    const href = (link as HTMLAnchorElement).href;
    if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
      linkUrls.push(href);
    }
  });
  
  return {
    title,
    description,
    url,
    domain,
    textContent,
    images,
    links: linkUrls,
    timestamp: new Date()
  };
};

/**
 * Extract main text content from the page
 */
export const extractMainTextContent = (): string => {
  // Remove script and style elements
  const scripts = document.querySelectorAll('script, style, noscript, iframe, nav, footer, header');
  scripts.forEach(el => el.remove());
  
  // Get text from common content containers
  const contentSelectors = [
    'main',
    'article',
    '.content',
    '.post-content',
    '.entry-content',
    '#content',
    '.main-content',
    'body'
  ];
  
  let content = '';
  
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      content = element.textContent || (element as HTMLElement).innerText || '';
      if (content.trim().length > 100) {
        break; // Found substantial content
      }
    }
  }
  
  // Clean up the text
  return cleanTextContent(content);
};

/**
 * Extract all images from the page
 */
export const extractImages = (): string[] => {
  const images = document.querySelectorAll('img');
  const imageUrls: string[] = [];
  
  images.forEach(img => {
    const src = img.src || img.dataset.src;
    if (src && !src.startsWith('data:')) {
      imageUrls.push(src);
    }
  });
  
  return imageUrls;
};

/**
 * Extract all links from the page
 */
export const extractLinks = (): string[] => {
  const links = document.querySelectorAll('a[href]');
  const linkUrls: string[] = [];
  
  links.forEach(link => {
    const href = (link as HTMLAnchorElement).href;
    if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
      linkUrls.push(href);
    }
  });
  
  return linkUrls;
};

/**
 * Clean and format text content
 */
const cleanTextContent = (text: string): string => {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .trim()
    .substring(0, 5000); // Limit to 5000 characters
};

/**
 * Extract specific content by CSS selector
 */
export const extractBySelector = (selector: string): string => {
  const element = document.querySelector(selector);
  return element?.textContent?.trim() || '';
};

/**
 * Extract social media specific content
 */
export const extractSocialMediaContent = () => {
  const platform = detectSocialPlatform();
  
  switch (platform) {
    case 'youtube':
      return extractYouTubeContent();
    case 'instagram':
      return extractInstagramContent();
    case 'twitter':
      return extractTwitterContent();
    case 'linkedin':
      return extractLinkedInContent();
    default:
      return scrapeCurrentPage();
  }
};

/**
 * Detect which social media platform the user is on
 */
const detectSocialPlatform = (): string => {
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.includes('youtube.com')) return 'youtube';
  if (hostname.includes('instagram.com')) return 'instagram';
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
  if (hostname.includes('linkedin.com')) return 'linkedin';
  if (hostname.includes('facebook.com')) return 'facebook';
  if (hostname.includes('reddit.com')) return 'reddit';
  
  return 'unknown';
};

/**
 * Extract YouTube specific content
 */
const extractYouTubeContent = () => {
  const title = extractBySelector('h1.ytd-video-primary-info-renderer') || 
                extractBySelector('.title.style-scope.ytd-video-primary-info-renderer') ||
                document.title;
  
  const description = extractBySelector('#description-text') || 
                     extractBySelector('.ytd-video-secondary-info-renderer #description');
  
  const channel = extractBySelector('#channel-name') || 
                 extractBySelector('.ytd-channel-name');
  
  return {
    platform: 'youtube',
    title,
    description,
    channel,
    url: window.location.href,
    timestamp: new Date()
  };
};

/**
 * Extract Instagram specific content
 */
const extractInstagramContent = () => {
  const caption = extractBySelector('article div[data-testid="post-caption"]') ||
                 extractBySelector('._a9zs');
  
  const username = extractBySelector('header a') ||
                  extractBySelector('._a9zc');
  
  return {
    platform: 'instagram',
    caption,
    username,
    url: window.location.href,
    timestamp: new Date()
  };
};

/**
 * Extract Twitter specific content
 */
const extractTwitterContent = () => {
  const tweet = extractBySelector('article[data-testid="tweet"]') ||
               extractBySelector('.tweet-text');
  
  const username = extractBySelector('[data-testid="User-Name"]') ||
                  extractBySelector('.username');
  
  return {
    platform: 'twitter',
    tweet,
    username,
    url: window.location.href,
    timestamp: new Date()
  };
};

/**
 * Extract LinkedIn specific content
 */
const extractLinkedInContent = () => {
  const post = extractBySelector('.feed-shared-update-v2__description') ||
              extractBySelector('.feed-shared-text');
  
  const author = extractBySelector('.feed-shared-actor__name') ||
                extractBySelector('.feed-shared-actor__title');
  
  return {
    platform: 'linkedin',
    post,
    author,
    url: window.location.href,
    timestamp: new Date()
  };
}; 