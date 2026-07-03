import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Check, ChevronLeft, Landmark, Minus, Plus, Trophy, X } from 'lucide-react'

import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { COLOR_META, playerDisplayName } from '#/lib/colors.ts'
import {
  addTicket,
  adjustRouteCount,
  adjustStations,
  removeTicket,
  toggleLongestPath,
  toggleTicket,
  useGame,
  useHydrated,
} from '#/lib/game-store.ts'
import {
  EDITION_CONFIG,
  LONGEST_PATH_BONUS,
  ROUTE_POINTS,
  STARTING_STATIONS,
  STATION_POINTS,
  globetrotterWinnerIds,
  scorePlayer,
} from '#/lib/scoring.ts'
import type { Edition, Player } from '#/lib/scoring.ts'
import { absoluteUrl } from '#/lib/site.ts'
import { cn } from '#/lib/utils.ts'

export const Route = createFileRoute('/score')({
  validateSearch: (search: Record<string, unknown>): { player?: string } => ({
    player: typeof search.player === 'string' ? search.player : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Score the Board — Ticket to Ride Scorer' },
      {
        name: 'description',
        content:
          'Count claimed routes, destination tickets, leftover stations, and the longest path bonus for every player — the fastest Ticket to Ride points counter for tallying final scores.',
      },
    ],
    links: [{ rel: 'canonical', href: absoluteUrl('/score') }],
  }),
  component: ScoreScreen,
})

function ScoreScreen() {
  const { players, edition, globetrotter } = useGame()
  const hydrated = useHydrated()
  const navigate = useNavigate()
  const { player: playerParam } = Route.useSearch()

  useEffect(() => {
    if (hydrated && players.length === 0) navigate({ to: '/', replace: true })
  }, [hydrated, players.length, navigate])

  if (players.length === 0) return null

  const selected =
    players.find((p) => p.id === playerParam) ?? players[0]
  const globetrotterWinners = globetrotterWinnerIds(
    players,
    globetrotter && EDITION_CONFIG[edition].expansionLabel !== null,
  )

  return (
    <main className="flex flex-1 flex-col gap-4 pt-2">
      <header className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to players"
          onClick={() => navigate({ to: '/' })}
        >
          <ChevronLeft />
        </Button>
        <h1 className="text-lg font-bold">Score the board</h1>
      </header>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {players.map((p) => {
          const meta = COLOR_META[p.color]
          const active = p.id === selected.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                navigate({ to: '/score', search: { player: p.id } })
              }
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all',
                active
                  ? cn(meta.bg, meta.fg, 'shadow-sm')
                  : 'border bg-card text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'size-2.5 rounded-full',
                  active ? 'bg-current opacity-70' : meta.bg,
                )}
              />
              {playerDisplayName(p.name, p.color)}
              <span className="tabular-nums opacity-80">
                {scorePlayer(p, edition, globetrotterWinners.has(p.id)).total}
              </span>
            </button>
          )
        })}
      </nav>

      <PlayerPanel
        key={selected.id}
        player={selected}
        edition={edition}
        hasGlobetrotter={globetrotterWinners.has(selected.id)}
      />

      <Button
        size="lg"
        onClick={() => navigate({ to: '/results' })}
        className="mt-auto h-14 bg-blue-900 text-lg hover:bg-blue-800"
      >
        <Trophy className="size-5" />
        Final results
      </Button>
    </main>
  )
}

function PlayerPanel({
  player,
  edition,
  hasGlobetrotter,
}: {
  player: Player
  edition: Edition
  hasGlobetrotter: boolean
}) {
  const meta = COLOR_META[player.color]
  const config = EDITION_CONFIG[edition]
  const score = scorePlayer(player, edition, hasGlobetrotter)

  return (
    <div className="flex flex-col gap-4">
      <section
        className={cn(
          'flex items-center justify-between rounded-2xl px-5 py-4',
          meta.bg,
          meta.fg,
        )}
      >
        <div>
          <div className="text-lg font-bold">
            {playerDisplayName(player.name, player.color)}
          </div>
          <div className="text-xs opacity-80">
            Trains {score.routes} · Tickets {score.tickets >= 0 ? '+' : ''}
            {score.tickets}
            {config.hasStations && ` · Stations +${score.stations}`}
            {score.bonus > 0 && ` · Path +${score.bonus}`}
            {score.globetrotter > 0 && ` · Globetrotter +${score.globetrotter}`}
          </div>
        </div>
        <div className="text-4xl font-extrabold tabular-nums">
          {score.total}
        </div>
      </section>

      <RoutesSection player={player} edition={edition} />
      <TicketsSection player={player} />
      {config.hasStations && <StationsSection player={player} />}

      {config.hasLongestPath && (
      <section className="rounded-2xl border p-2">
        <button
          type="button"
          onClick={() => toggleLongestPath(player.id)}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors',
            player.longestPath ? 'bg-amber-100' : 'active:bg-accent',
          )}
        >
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full',
              player.longestPath
                ? 'bg-amber-400 text-amber-950'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <Trophy className="size-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Longest continuous path</div>
            <div className="text-xs text-muted-foreground">
              +{LONGEST_PATH_BONUS} points · ties can share it
            </div>
          </div>
          <div
            className={cn(
              'flex size-6 items-center justify-center rounded-full border-2',
              player.longestPath
                ? 'border-amber-500 bg-amber-500 text-white'
                : 'border-muted-foreground/30',
            )}
          >
            {player.longestPath && <Check className="size-4" />}
          </div>
        </button>
      </section>
      )}
    </div>
  )
}

function RoutesSection({
  player,
  edition,
}: {
  player: Player
  edition: Edition
}) {
  return (
    <section className="rounded-2xl border">
      <h2 className="px-4 pt-3 text-sm font-semibold text-muted-foreground">
        Claimed routes — count each route on the board by length
      </h2>
      <div className="divide-y">
        {EDITION_CONFIG[edition].routeLengths.map((length) => {
          const count = player.routeCounts[length] ?? 0
          return (
            <div key={length} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex w-20 shrink-0 items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums">
                  {length}
                </span>
                <span className="text-xs text-muted-foreground">
                  {length === 1 ? 'car' : 'cars'}
                </span>
              </div>
              <span className="flex-1 text-xs text-muted-foreground">
                {ROUTE_POINTS[length]} pts each
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Remove a ${length}-car route`}
                  disabled={count === 0}
                  onClick={() => adjustRouteCount(player.id, length, -1)}
                  className="size-10 rounded-full"
                >
                  <Minus />
                </Button>
                <span
                  className={cn(
                    'w-8 text-center text-lg font-bold tabular-nums',
                    count === 0 && 'text-muted-foreground/40',
                  )}
                >
                  {count}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Add a ${length}-car route`}
                  onClick={() => adjustRouteCount(player.id, length, 1)}
                  className="size-10 rounded-full"
                >
                  <Plus />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function StationsSection({ player }: { player: Player }) {
  return (
    <section className="rounded-2xl border p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Landmark className="size-5" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">Stations left over</div>
          <div className="text-xs text-muted-foreground">
            +{STATION_POINTS} points each ·{' '}
            {player.stationsLeft * STATION_POINTS} pts
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="One fewer station left"
            disabled={player.stationsLeft === 0}
            onClick={() => adjustStations(player.id, -1)}
            className="size-10 rounded-full"
          >
            <Minus />
          </Button>
          <span className="w-8 text-center text-lg font-bold tabular-nums">
            {player.stationsLeft}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="One more station left"
            disabled={player.stationsLeft === STARTING_STATIONS}
            onClick={() => adjustStations(player.id, 1)}
            className="size-10 rounded-full"
          >
            <Plus />
          </Button>
        </div>
      </div>
    </section>
  )
}

function TicketsSection({ player }: { player: Player }) {
  const [value, setValue] = useState('')
  const parsed = Number.parseInt(value, 10)
  const valid = Number.isFinite(parsed) && parsed > 0

  const add = (completed: boolean) => {
    if (!valid) return
    addTicket(player.id, parsed, completed)
    setValue('')
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border p-4">
      <h2 className="text-sm font-semibold text-muted-foreground">
        Destination tickets — made it? add. missed it? subtract.
      </h2>

      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          enterKeyHint="done"
          placeholder="Points"
          className="h-12 w-24 text-center text-base font-semibold"
        />
        <Button
          disabled={!valid}
          onClick={() => add(true)}
          className="h-12 flex-1 bg-green-600 text-base hover:bg-green-700"
        >
          <Check className="size-5" />
          Made it
        </Button>
        <Button
          disabled={!valid}
          onClick={() => add(false)}
          className="h-12 flex-1 bg-red-600 text-base hover:bg-red-700"
        >
          <X className="size-5" />
          Missed
        </Button>
      </div>

      {player.tickets.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {player.tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={cn(
                  'flex items-center overflow-hidden rounded-full border text-sm font-bold tabular-nums',
                  ticket.completed
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleTicket(player.id, ticket.id)}
                  className="py-2 pl-3.5 pr-1"
                >
                  {ticket.completed ? '+' : '−'}
                  {ticket.value}
                </button>
                <button
                  type="button"
                  aria-label="Delete ticket"
                  onClick={() => removeTicket(player.id, ticket.id)}
                  className="p-2 opacity-50"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Tap a ticket to flip it between made and missed.
          </p>
        </>
      )}
    </section>
  )
}
