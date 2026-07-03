import { useEffect } from 'react'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { SITE_URL, absoluteUrl } from '#/lib/site.ts'
import appCss from '../styles.css?url'

const SITE_NAME = 'Ticket to Ride Scorer'
const SITE_DESCRIPTION =
  'Score Ticket to Ride games fast on your phone — count routes, tickets, stations, and bonuses for USA, Europe, and Nordic Countries editions, including the 1910/1912 Globetrotter expansion.'
const SITE_IMAGE = absoluteUrl('/logo512.png')

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      { title: SITE_NAME },
      {
        name: 'description',
        content: SITE_DESCRIPTION,
      },
      { name: 'theme-color', content: '#1e3a8a' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'TTR Scorer' },

      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:title', content: SITE_NAME },
      { property: 'og:description', content: SITE_DESCRIPTION },
      { property: 'og:image', content: SITE_IMAGE },
      { property: 'og:url', content: SITE_URL },

      // Twitter Card
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: SITE_NAME },
      { name: 'twitter:description', content: SITE_DESCRIPTION },
      { name: 'twitter:image', content: SITE_IMAGE },

      // Structured data (JSON-LD): renders as <script type="application/ld+json">
      {
        'script:ld+json': {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: SITE_NAME,
          description: SITE_DESCRIPTION,
          url: SITE_URL,
          image: SITE_IMAGE,
          applicationCategory: 'GameApplication',
          operatingSystem: 'Any',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        },
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      { rel: 'apple-touch-icon', href: '/logo192.png' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground antialiased">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
        <Scripts />
      </body>
    </html>
  )
}
