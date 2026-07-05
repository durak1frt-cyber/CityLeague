import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate or fallback to a default locale
  if (!locale || !['tr', 'en'].includes(locale)) {
    locale = 'tr';
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
