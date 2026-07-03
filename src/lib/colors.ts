import type { TrainColor } from '#/lib/scoring.ts'

interface ColorMeta {
  label: string
  /** Solid swatch/pill background */
  bg: string
  /** Text color that reads on `bg` */
  fg: string
  /** Subtle tinted surface for cards/sections */
  tint: string
  ring: string
}

export const COLOR_META: Record<TrainColor, ColorMeta> = {
  blue: {
    label: 'Blue',
    bg: 'bg-blue-600',
    fg: 'text-white',
    tint: 'bg-blue-50 border-blue-200',
    ring: 'ring-blue-600',
  },
  red: {
    label: 'Red',
    bg: 'bg-red-600',
    fg: 'text-white',
    tint: 'bg-red-50 border-red-200',
    ring: 'ring-red-600',
  },
  green: {
    label: 'Green',
    bg: 'bg-green-600',
    fg: 'text-white',
    tint: 'bg-green-50 border-green-200',
    ring: 'ring-green-600',
  },
  yellow: {
    label: 'Yellow',
    bg: 'bg-yellow-400',
    fg: 'text-yellow-950',
    tint: 'bg-yellow-50 border-yellow-200',
    ring: 'ring-yellow-400',
  },
  black: {
    label: 'Black',
    bg: 'bg-zinc-800',
    fg: 'text-white',
    tint: 'bg-zinc-100 border-zinc-300',
    ring: 'ring-zinc-800',
  },
}

export function playerDisplayName(name: string, color: TrainColor): string {
  return name.trim() || COLOR_META[color].label
}
