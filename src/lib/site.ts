// Keep in sync with public/robots.txt and public/sitemap.xml.
export const SITE_URL = 'https://tickettoride.lloydhumphreys.com'

/** Build an absolute URL (canonical links, og:image, etc.) from a site-relative path. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString()
}
