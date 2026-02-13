// Analytics stub - replace with actual implementation later
// This tracks events for future analytics integration

type AnalyticsEvent =
  | 'onboarding_completed'
  | 'photo_uploaded'
  | 'elements_selected'
  | 'look_generated'
  | 'look_saved'
  | 'look_favorited'
  | 'paywall_shown'
  | 'paywall_converted'
  | 'preset_selected'
  | 'attribute_tag_toggled'
  | 'custom_attribute_added';

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

export function trackEvent(event: AnalyticsEvent, properties?: EventProperties) {
  // Stub implementation - log to console in development
  if (__DEV__) {
    console.log(`[Analytics] ${event}`, properties);
  }

  // TODO: Replace with actual analytics SDK
  // e.g., Mixpanel, Amplitude, Firebase Analytics
}

export function identifyUser(userId: string, traits?: EventProperties) {
  if (__DEV__) {
    console.log(`[Analytics] Identify: ${userId}`, traits);
  }
}

export function resetUser() {
  if (__DEV__) {
    console.log('[Analytics] User reset');
  }
}
