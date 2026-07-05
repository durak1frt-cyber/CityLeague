import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Supported locales
  locales: ['tr', 'en'],

  // Default locale if no match is found
  defaultLocale: 'tr',

  // Ensure URLs always have the locale prefix (e.g. /tr/about or /en/about)
  localePrefix: 'always'
});

export const config = {
  // Match both localized paths and general route requests
  matcher: [
    // Match the root path
    '/',
    // Match locale prefixes
    '/(tr|en)/:path*',
    // Match all routing paths, excluding static assets/files
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
