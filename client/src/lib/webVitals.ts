import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import { trackEvent } from './analytics';

export function reportWebVitals() {
  const sendToAnalytics = (metric: Metric) => {
    trackEvent('web_vitals', {
      name: metric.name,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      delta: Math.round(metric.name === 'CLS' ? metric.delta * 1000 : metric.delta),
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType,
    });
  };

  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
  onINP(sendToAnalytics);
}
