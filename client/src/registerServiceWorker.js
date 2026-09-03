/**
 * Service worker registration.
 *
 * Only in a production build: an SW in dev would serve stale modules and make
 * debugging confusing. Registration failure is silent by design - the app must
 * work perfectly without offline support.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' }).catch(() => {
      // Offline caching is an enhancement, never a requirement.
    });
  });
}
