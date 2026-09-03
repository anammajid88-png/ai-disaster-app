import { useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageProvider';

const BASE_URL = 'https://ai-disaster-app.vercel.app';

/**
 * Per-route document metadata.
 *
 * The app is a SPA, so title/description/canonical are updated on navigation.
 * They are also re-applied when the language changes, which keeps the tab title
 * and the shared link description in the language the user is actually reading.
 */
export function useDocumentMeta({ title, description, path = '/' }) {
  const { t, languageMeta } = useLanguage();

  useEffect(() => {
    const appName = t('app.name');
    document.title = title ? `${title} | ${appName}` : appName;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${BASE_URL}${path === '/' ? '/' : path}`);

    const ogLocale = document.querySelector('meta[property="og:locale"]');
    ogLocale?.setAttribute('content', languageMeta.htmlLang);
  }, [t, title, description, path, languageMeta.htmlLang]);
}
