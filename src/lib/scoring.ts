export const TRAIN_COLORS = ['blue', 'red', 'green', 'yellow', 'black'] as const
export type TrainColor = (typeof TRAIN_COLORS)[number]

export const ROUTE_LENGTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const
export type RouteLength = (typeof ROUTE_LENGTHS)[number]

export const ROUTE_POINTS: Record<RouteLength, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 10,
  6: 15,
  7: 18,
  8: 21,
  9: 27,
}

export type Edition = 'usa' | 'europe' | 'nordic'

export interface EditionConfig {
  label: string
  flag: string
  hint: string
  /** Route lengths that actually exist on this map. */
  routeLengths: Array<RouteLength>
  hasLongestPath: boolean
  hasStations: boolean
  /** Ticket expansion that adds the Globetrotter bonus, if one exists. */
  expansionLabel: string | null
  maxPlayers: number
}

export const EDITION_CONFIG: Record<Edition, EditionConfig> = {
  usa: {
    label: 'USA',
    flag: '🇺🇸',
    hint: 'Routes of 1–6 cars · longest path +10',
    routeLengths: [1, 2, 3, 4, 5, 6],
    hasLongestPath: true,
    hasStations: false,
    expansionLabel: '1910 expansion',
    maxPlayers: 5,
  },
  europe: {
    label: 'Europe',
    flag: '🇪🇺',
    hint: '8-car routes (21 pts) · +4 per unused station · longest path +10',
    routeLengths: [1, 2, 3, 4, 6, 8],
    hasLongestPath: true,
    hasStations: true,
    expansionLabel: '1912 expansion',
    maxPlayers: 5,
  },
  nordic: {
    label: 'Nordic Countries',
    flag: '❄️',
    hint: '2–3 players · routes up to 9 cars (27 pts) · no longest-path bonus',
    routeLengths: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    hasLongestPath: false,
    hasStations: false,
    expansionLabel: null,
    maxPlayers: 3,
  },
}

export const EDITIONS = Object.keys(EDITION_CONFIG) as Array<Edition>

/**
 * What the setup dropdown offers: each entry is an actual published game
 * (base game or ticket expansion), mapped onto edition + globetrotter.
 */
export interface GameVariant {
  id: string
  name: string
  flag: string
  edition: Edition
  globetrotter: boolean
  hint: string
}

export const GAME_VARIANTS: Array<GameVariant> = [
  {
    id: 'usa',
    name: 'Ticket to Ride',
    flag: '🇺🇸',
    edition: 'usa',
    globetrotter: false,
    hint: 'Routes of 1–6 cars · longest path +10',
  },
  {
    id: 'usa-1910',
    name: 'Ticket to Ride: USA 1910',
    flag: '🇺🇸',
    edition: 'usa',
    globetrotter: true,
    hint: 'USA scoring · Globetrotter +15 for most completed tickets',
  },
  {
    id: 'europe',
    name: 'Ticket to Ride: Europe',
    flag: '🇪🇺',
    edition: 'europe',
    globetrotter: false,
    hint: '8-car routes (21 pts) · +4 per unused station · longest path +10',
  },
  {
    id: 'europa-1912',
    name: 'Ticket to Ride: Europa 1912',
    flag: '🇪🇺',
    edition: 'europe',
    globetrotter: true,
    hint: 'Europe scoring · Globetrotter +15 for most completed tickets',
  },
  {
    id: 'nordic',
    name: 'Ticket to Ride: Nordic Countries',
    flag: '❄️',
    edition: 'nordic',
    globetrotter: false,
    hint: '2–3 players · routes up to 9 cars (27 pts) · no longest-path bonus',
  },
]

/** The variant matching the current game state (for the dropdown value). */
export function variantFor(edition: Edition, globetrotter: boolean): GameVariant {
  const effective =
    globetrotter && EDITION_CONFIG[edition].expansionLabel !== null
  return (
    GAME_VARIANTS.find(
      (v) => v.edition === edition && v.globetrotter === effective,
    ) ?? GAME_VARIANTS[0]
  )
}

export const LONGEST_PATH_BONUS = 10
/** 1910 (USA) / 1912 (Europe) expansions: most completed tickets. */
export const GLOBETROTTER_BONUS = 15
export const STATION_POINTS = 4
export const STARTING_STATIONS = 3

export interface Ticket {
  id: string
  value: number
  completed: boolean
}

export interface Player {
  id: string
  name: string
  color: TrainColor
  routeCounts: Record<RouteLength, number>
  tickets: Ticket[]
  longestPath: boolean
  /** Europe only: stations not placed, +4 each at game end. */
  stationsLeft: number
}

export interface ScoreBreakdown {
  routes: number
  tickets: number
  stations: number
  bonus: number
  globetrotter: number
  total: number
  completedTickets: number
}

export function emptyRouteCounts(): Record<RouteLength, number> {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
}

export function scorePlayer(
  player: Player,
  edition: Edition,
  hasGlobetrotter = false,
): ScoreBreakdown {
  const config = EDITION_CONFIG[edition]
  const routes = config.routeLengths.reduce(
    (sum, len) => sum + (player.routeCounts[len] ?? 0) * ROUTE_POINTS[len],
    0,
  )
  const tickets = player.tickets.reduce(
    (sum, t) => sum + (t.completed ? t.value : -t.value),
    0,
  )
  const stations = config.hasStations
    ? player.stationsLeft * STATION_POINTS
    : 0
  const bonus =
    config.hasLongestPath && player.longestPath ? LONGEST_PATH_BONUS : 0
  const globetrotter = hasGlobetrotter ? GLOBETROTTER_BONUS : 0
  return {
    routes,
    tickets,
    stations,
    bonus,
    globetrotter,
    total: routes + tickets + stations + bonus + globetrotter,
    completedTickets: player.tickets.filter((t) => t.completed).length,
  }
}

/**
 * Globetrotter goes to whoever completed the most tickets (ties share it,
 * like the longest-path bonus; nobody gets it before any ticket is made).
 */
export function globetrotterWinnerIds(
  players: Array<Player>,
  enabled: boolean,
): Set<string> {
  if (!enabled || players.length === 0) return new Set()
  const completed = (p: Player) => p.tickets.filter((t) => t.completed).length
  const max = Math.max(...players.map(completed))
  if (max === 0) return new Set()
  return new Set(players.filter((p) => completed(p) === max).map((p) => p.id))
}

/** True once the player has any entered data (used for "continue" hints). */
export function hasAnyScoring(player: Player): boolean {
  return (
    player.tickets.length > 0 ||
    player.longestPath ||
    player.stationsLeft !== STARTING_STATIONS ||
    Object.values(player.routeCounts).some((count) => count > 0)
  )
}

/**
 * Final standings: highest total wins; official tiebreaker is most
 * completed destination tickets.
 */
export function rankPlayers(
  players: Array<Player>,
  edition: Edition,
  globetrotterEnabled = false,
): Array<{ player: Player; score: ScoreBreakdown }> {
  const winners = globetrotterWinnerIds(
    players,
    globetrotterEnabled && EDITION_CONFIG[edition].expansionLabel !== null,
  )
  return players
    .map((player) => ({
      player,
      score: scorePlayer(player, edition, winners.has(player.id)),
    }))
    .sort(
      (a, b) =>
        b.score.total - a.score.total ||
        b.score.completedTickets - a.score.completedTickets,
    )
}
