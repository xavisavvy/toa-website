/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Google Analytics 4 Utility
 * Handles GA4 pageview and event tracking
 */

declare global {
  interface Window {
     
    gtag?: () => void;
     
    dataLayer?: any[];
  }
}

export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Initialize Google Analytics
export const initGA = () => {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics Measurement ID not configured');
    return;
  }

  // Add gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.gtag = function gtag() {
    window.dataLayer = window.dataLayer || [];
     
     
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date().toISOString());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll handle pageviews manually
  });
};

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (!window.gtag || !GA_MEASUREMENT_ID) {return;}

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title || document.title,
  });
};

// Track custom events
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, unknown>
) => {
  if (!window.gtag || !GA_MEASUREMENT_ID) {return;}

  window.gtag('event', eventName, parameters);
};

// Common event trackers
export const analytics = {
  // Page views
  pageView: (url: string, title?: string) => trackPageView(url, title),

  // User interactions
  buttonClick: (buttonName: string, location?: string) => {
    trackEvent('button_click', {
      button_name: buttonName,
      location: location || window.location.pathname,
    });
  },

  // External link clicks
  externalLinkClick: (url: string, linkText?: string) => {
    trackEvent('external_link_click', {
      url,
      link_text: linkText,
      outbound: true,
    });
  },

  // Video interactions
  videoPlay: (videoId: string, videoTitle?: string) => {
    trackEvent('video_play', {
      video_id: videoId,
      video_title: videoTitle,
    });
  },

  // E-commerce events
  viewItem: (itemName: string, itemId?: string, price?: number) => {
    trackEvent('view_item', {
      item_name: itemName,
      item_id: itemId,
      price,
    });
  },

  addToCart: (itemName: string, itemId?: string, price?: number, quantity?: number) => {
    trackEvent('add_to_cart', {
      item_name: itemName,
      item_id: itemId,
      price,
      quantity,
    });
  },

  removeFromCart: (itemName: string, itemId?: string, price?: number, quantity?: number) => {
    trackEvent('remove_from_cart', {
      item_name: itemName,
      item_id: itemId,
      price,
      quantity,
    });
  },

  beginCheckout: (value?: number, items?: string[]) => {
    trackEvent('begin_checkout', {
      value,
      items,
    });
  },

  purchase: (transactionId: string, value: number, items?: string[]) => {
    trackEvent('purchase', {
      transaction_id: transactionId,
      value,
      items,
    });
  },

  // Social interactions
  socialShare: (platform: string, contentType?: string, contentId?: string) => {
    trackEvent('share', {
      method: platform,
      content_type: contentType,
      content_id: contentId,
    });
  },

  // Form submissions
  formSubmit: (formName: string, success: boolean = true) => {
    trackEvent('form_submit', {
      form_name: formName,
      success,
    });
  },

  // Character page views
  characterView: (characterName: string, characterId: string) => {
    trackEvent('character_view', {
      character_name: characterName,
      character_id: characterId,
    });
  },

  // Podcast interactions
  podcastPlay: (platform: string) => {
    trackEvent('podcast_play', {
      platform,
    });
  },

  // Newsletter signup
  newsletterSignup: (location?: string) => {
    trackEvent('newsletter_signup', {
      location: location || window.location.pathname,
    });
  },

  // Search
  search: (searchTerm: string, resultsCount?: number) => {
    trackEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount,
    });
  },
};

