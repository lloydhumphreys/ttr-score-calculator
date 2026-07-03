import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { TrainFront, Plus, X } from 'lucide-react'

import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import { COLOR_META } from '#/lib/colors.ts'
import {
  addPlayer,
  removePlayer,
  setPlayerColor,
  setPlayerName,
  setVariant,
  useGame,
} from '#/lib/game-store.ts'
import {
  EDITION_CONFIG,
  GAME_VARIANTS,
  TRAIN_COLORS,
  hasAnyScoring,
  variantFor,
} from '#/lib/scoring.ts'
import { absoluteUrl } from '#/lib/site.ts'
import { cn } from '#/lib/utils.ts'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Ticket to Ride Score Calculator | Ticket to Ride Scorer' },
      {
        name: 'description',
        content:
          'Set up your Ticket to Ride game and start scoring in seconds — choose USA, Europe, or Nordic Countries, add players, and enable the 1910/1912 Globetrotter expansion.',
      },
    ],
    links: [{ rel: 'canonical', href: absoluteUrl('/') }],
  }),
  component: SetupScreen,
})

function SetupScreen() {
  const { players, edition, globetrotter } = useGame()
  const navigate = useNavigate()
  const usedColors = new Set(players.map((p) => p.color))
  const hasScores = players.some(hasAnyScoring)
  const config = EDITION_CONFIG[edition]
  const variant = variantFor(edition, globetrotter)

  return (
    <main className="flex flex-1 flex-col gap-6 pt-6">
      <header className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-900 text-white shadow-md">
          <TrainFront className="size-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Ticket to Ride Scorer
        </h1>
        <p className="text-sm text-muted-foreground">
          Add the players at your table, then count up the board together.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <Select
          value={variant.id}
          onValueChange={(id) => {
            const next = GAME_VARIANTS.find((v) => v.id === id)
            if (next) setVariant(next)
          }}
        >
          <SelectTrigger className="!h-14 w-full text-base font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GAME_VARIANTS.map((v) => (
              <SelectItem key={v.id} value={v.id} className="py-3.5 text-base">
                {v.flag} {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-center text-xs text-muted-foreground">
          {variant.hint}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        {players.map((player) => (
          <div
            key={player.id}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3',
              COLOR_META[player.color].tint,
            )}
          >
            <div className="flex shrink-0 gap-1.5">
              {TRAIN_COLORS.map((color) => {
                const takenByOther =
                  color !== player.color && usedColors.has(color)
                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={`${COLOR_META[color].label} trains`}
                    disabled={takenByOther}
                    onClick={() => setPlayerColor(player.id, color)}
                    className={cn(
                      'size-7 rounded-full transition-all',
                      COLOR_META[color].bg,
                      color === player.color
                        ? cn('ring-2 ring-offset-2', COLOR_META[color].ring)
                        : 'scale-90 opacity-40',
                      takenByOther && 'opacity-15',
                    )}
                  />
                )
              })}
            </div>
            <Input
              value={player.name}
              placeholder={COLOR_META[player.color].label}
              maxLength={20}
              onChange={(e) => setPlayerName(player.id, e.target.value)}
              className="h-10 border-0 bg-white/70 text-base shadow-none"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remove player"
              onClick={() => removePlayer(player.id)}
              className="shrink-0 text-muted-foreground"
            >
              <X />
            </Button>
          </div>
        ))}

        {players.length < config.maxPlayers && (
          <Button
            variant="outline"
            size="lg"
            onClick={addPlayer}
            className="h-12 border-dashed text-base"
          >
            <Plus className="size-5" />
            Add player
          </Button>
        )}
      </section>

      <div className="mt-auto flex flex-col gap-2">
        <Button
          size="lg"
          disabled={players.length === 0}
          onClick={() => navigate({ to: '/score' })}
          className="h-14 bg-blue-900 text-lg hover:bg-blue-800"
        >
          {hasScores ? 'Continue scoring' : 'Start scoring'}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          2–{config.maxPlayers} players · scores save automatically on this
          phone
        </p>
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground/70">
          Unofficial fan-made tool — not affiliated with, endorsed, or
          sponsored by Days of Wonder or Asmodee. Ticket to Ride is a trademark
          of Days of Wonder, Inc.
        </p>
      </div>
    </main>
  )
}
