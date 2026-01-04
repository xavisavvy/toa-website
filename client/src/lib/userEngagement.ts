import { analytics } from './analytics';

let scrollDepthTracked = new Set<number>();
let lastClickTime = 0;
let lastClickElement: string | null = null;
let clickCount = 0;

export function initScrollTracking() {
  let ticking = false;

  const trackScrollDepth = () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const scrollPercent = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);

    const depths = [25, 50, 75, 100];
    depths.forEach(depth => {
      if (scrollPercent >= depth && !scrollDepthTracked.has(depth)) {
        scrollDepthTracked.add(depth);
        analytics.scrollDepth(depth);
      }
    });

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(trackScrollDepth);
      ticking = true;
    }
  });
}

export function initRageClickDetection() {
  document.addEventListener('click', (event) => {
    const now = Date.now();
    const target = event.target as HTMLElement;
    const elementDesc = `${target.tagName}${target.className ? '.' + target.className.split(' ')[0] : ''}`;

    if (now - lastClickTime < 1000 && elementDesc === lastClickElement) {
      clickCount++;
      if (clickCount >= 3) {
        analytics.rageClick(elementDesc);
        clickCount = 0;
      }
    } else {
      clickCount = 1;
    }

    lastClickTime = now;
    lastClickElement = elementDesc;
  });
}

export function initSessionTracking() {
  const sessionStart = Date.now();
  let pagesViewed = 1;

  window.addEventListener('beforeunload', () => {
    const sessionDuration = Date.now() - sessionStart;
    analytics.sessionQuality(sessionDuration, pagesViewed);
  });

  const originalPushState = window.history.pushState;
  window.history.pushState = function(...args) {
    pagesViewed++;
    return originalPushState.apply(this, args);
  };
}
