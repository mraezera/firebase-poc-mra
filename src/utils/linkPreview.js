/**
 * Utility functions for link preview generation
 */

/**
 * Extract URLs from text
 */
export const extractUrls = (text) => {
  if (!text) return [];

  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);

  return matches || [];
};

/**
 * Fetch link preview metadata from a URL
 * Note: This is a simplified version that uses a CORS proxy.
 * In production, you should use a backend service or Firebase Cloud Function.
 */
export const fetchLinkPreview = async (url) => {
  try {
    // Validate URL
    const urlObj = new URL(url);

    // For demo purposes, we'll create a basic preview from the URL
    // In production, use a service like:
    // - https://microlink.io
    // - https://www.linkpreview.net
    // - Firebase Cloud Functions with cheerio/meta-scraper

    // Basic fallback preview
    const preview = {
      url: url,
      title: urlObj.hostname.replace('www.', ''),
      description: url,
      image: null,
      favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
    };

    // Try to fetch using microlink.io free tier (has rate limits)
    try {
      const response = await fetch(
        `https://api.microlink.io?url=${encodeURIComponent(url)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          return {
            url: url,
            title: data.data.title || preview.title,
            description: data.data.description || preview.description,
            image: data.data.image?.url || data.data.logo?.url || null,
            favicon: data.data.logo?.url || preview.favicon
          };
        }
      }
    } catch (error) {
      console.warn('Failed to fetch from microlink.io, using fallback:', error);
    }

    return preview;
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return null;
  }
};

/**
 * Generate link previews for all URLs in text
 */
export const generateLinkPreviews = async (text) => {
  const urls = extractUrls(text);
  if (urls.length === 0) return [];

  // Limit to first 3 URLs to avoid too many requests
  const limitedUrls = urls.slice(0, 3);

  const previews = await Promise.all(
    limitedUrls.map(url => fetchLinkPreview(url))
  );

  return previews.filter(preview => preview !== null);
};
