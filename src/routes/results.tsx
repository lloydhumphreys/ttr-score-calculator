import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, Crown, RotateCcw, Trash2 } from 'lucide-react'

import { Button } from '#/components/ui/button.tsx'
import { COLOR_META, playerDisplayName } from '#/lib/colors.ts'
import {
  resetAll,
  resetScores,
  useGame,
  useHydrated,
} from '#/lib/game-store.ts'
import { EDITION_CONFIG, rankPlayers } from '#/lib/scoring.ts'
import { absoluteUrl } from '#/lib/site.ts'
import { cn } from '#/lib/utils.ts'

export const Route = createFileRoute('/results')({
  head: () => ({
    meta: [
      { title: 'Final Results — Ticket to Ride Scorer' },
      {
        name: 'description',
        content:
          'See final rankings and a full points breakdown for your Ticket to Ride game, plus how the official completed-tickets tiebreaker works.',
      },
    ],
    links: [{ rel: 'canonical', href: absoluteUrl('/results') }],
  }),
  component: ResultsScreen,
})

function ResultsScreen() {
  const { players, edition, globetrotter } = useGame()
  const hydrated = useHydrated()
  const navigate = useNavigate()
  const [confirmingReset, setConfirmingReset] = useState<
    'again' | 'new' | null
  >(null)

  useEffect(() => {
    if (hydrated && players.length === 0) navigate({ to: '/', replace: true })
  }, [hydrated, players.length, navigate])

  if (players.length === 0) return null

  const ranked = rankPlayers(players, edition, globetrotter)
  const winner = ranked[0]
  const tiedOnPoints =
    ranked.length > 1 && ranked[1].score.total === winner.score.total

  return (
    <main className="flex flex-1 flex-col gap-4 pt-2">
      <header className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to scoring"
          onClick={() => navigate({ to: '/score' })}
        >
          <ChevronLeft />
        </Button>
        <h1 className="text-lg font-bold">Final results</h1>
      </header>

      <section className="flex flex-col gap-3">
        {ranked.map(({ player, score }, index) => {
          const meta = COLOR_META[player.color]
          const isWinner = index === 0
          return (
            <div
              key={player.id}
              className={cn(
                'rounded-2xl border p-4',
                isWinner ? cn(meta.tint, 'border-2 shadow-sm') : 'bg-card',
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold',
                    meta.bg,
                    meta.fg,
                  )}
                >
                  {isWinner ? <Crown className="size-5" /> : index + 1}
                </div>
                <div className="flex-1 truncate text-lg font-bold">
                  {playerDisplayName(player.name, player.color)}
                </div>
                <div className="text-3xl font-extrabold tabular-nums">
                  {score.total}
                </div>
              </div>
              <div className="mt-2 flex gap-4 pl-13 text-xs text-muted-foreground">
                <span>Trains {score.routes}</span>
                <span>
                  Tickets {score.tickets >= 0 ? '+' : ''}
                  {score.tickets}
                </span>
                {EDITION_CONFIG[edition].hasStations && (
                  <span>Stations +{score.stations}</span>
                )}
                {score.bonus > 0 && <span>Longest path +{score.bonus}</span>}
                {score.globetrotter > 0 && (
                  <span>Globetrotter +{score.globetrotter}</span>
                )}
                <span>
                  {score.completedTickets} ticket
                  {score.completedTickets === 1 ? '' : 's'} made
                </span>
              </div>
            </div>
          )
        })}
      </section>

      {tiedOnPoints && (
        <p className="text-center text-xs text-muted-foreground">
          Tied on points — the official tiebreaker is most completed tickets.
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2">
        {confirmingReset ? (
          <div className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
            <p className="text-center text-sm font-medium">
              {confirmingReset === 'again'
                ? 'Clear all scores and keep the same players?'
                : 'Delete this game and all players?'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-12 flex-1"
                onClick={() => setConfirmingReset(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="h-12 flex-1"
                onClick={() => {
                  if (confirmingReset === 'again') {
                    resetScores()
                    navigate({ to: '/score' })
                  } else {
                    resetAll()
                    navigate({ to: '/' })
                  }
                }}
              >
                Yes, clear it
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button
              size="lg"
              onClick={() => setConfirmingReset('again')}
              className="h-14 bg-blue-900 text-lg hover:bg-blue-800"
            >
              <RotateCcw className="size-5" />
              Play again, same players
            </Button>
            <Button
              variant="ghost"
              onClick={() => setConfirmingReset('new')}
              className="h-11 text-muted-foreground"
            >
              <Trash2 className="size-4" />
              New game
            </Button>
          </>
        )}
      </div>
    </main>
  )
}
