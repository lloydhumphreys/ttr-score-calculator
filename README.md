# Ticket to Ride Score Calculator

A phone-optimized web app for scoring [Ticket to Ride](https://www.daysofwonder.com/tickettoride/) games at the end of play — count claimed routes, add up destination tickets, and let the app handle the bonuses.

**Live at [tickettoride.lloydhumphreys.com](https://tickettoride.lloydhumphreys.com)** — installable as a PWA and works offline.

## Supported games

- 🇺🇸 Ticket to Ride (USA)
- 🇺🇸 Ticket to Ride: USA 1910
- 🇪🇺 Ticket to Ride: Europe
- 🇪🇺 Ticket to Ride: Europa 1912
- ❄️ Ticket to Ride: Nordic Countries

Each game applies its own rules: route lengths and point values per map, Europe's train stations (+4 per unused station), the longest-path bonus (+10, absent in Nordic), and the 1910/1912 Globetrotter bonus (+15, awarded automatically to whoever completes the most tickets — ties share it). Winner is highest total; the official most-completed-tickets tiebreaker is applied.

## How it works

- **Setup** — pick the game, add 2–5 players with their train colors.
- **Score** — per player: tap counters for each route length, enter ticket values as made/missed, toggle longest path, count leftover stations.
- **Results** — ranked leaderboard with a full points breakdown.

Game state persists in `localStorage`, so an accidental refresh loses nothing. Everything runs on one phone passed around the table — no accounts, no server-side state.

## Stack

[TanStack Start](https://tanstack.com/start) (React 19, SSR) · Tailwind CSS v4 · [shadcn/ui](https://ui.shadcn.com) · deployed to [Cloudflare Workers](https://developers.cloudflare.com/workers/) via `@cloudflare/vite-plugin`.

The scoring rules live in [`src/lib/scoring.ts`](src/lib/scoring.ts) as pure functions with a per-edition config — adding another map is mostly a new `EDITION_CONFIG` entry.

## Development

```bash
pnpm install
pnpm dev        # local dev server
pnpm test       # vitest
pnpm build      # production build
pnpm run deploy # build + wrangler deploy
```

## Disclaimer

Unofficial fan-made tool — not affiliated with, endorsed, or sponsored by Days of Wonder or Asmodee. Ticket to Ride is a trademark of Days of Wonder, Inc.
