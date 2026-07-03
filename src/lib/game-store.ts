import { useSyncExternalStore } from 'react'
import {
  EDITION_CONFIG,
  emptyRouteCounts,
  STARTING_STATIONS,
  TRAIN_COLORS,
} from '#/lib/scoring.ts'
import type {
  Edition,
  GameVariant,
  Player,
  RouteLength,
  TrainColor,
} from '#/lib/scoring.ts'

export interface GameState {
  edition: Edition
  /** 1910/1912 expansion: Globetrotter bonus for most completed tickets. */
  globetrotter: boolean
  players: Array<Player>
}

const STORAGE_KEY = 'ttr-scorer-v1'
const EMPTY_STATE: GameState = {
  edition: 'usa',
  globetrotter: false,
  players: [],
}

let state: GameState = EMPTY_STATE
const listeners = new Set<() => void>()

/** Fill in fields that older saved games predate. */
function normalize(raw: Partial<GameState>): GameState {
  return {
    edition:
      raw.edition && raw.edition in EDITION_CONFIG ? raw.edition : 'usa',
    globetrotter: raw.globetrotter === true,
    players: (raw.players ?? []).map((p) => ({
      ...p,
      stationsLeft:
        typeof p.stationsLeft === 'number' ? p.stationsLeft : STARTING_STATIONS,
      routeCounts: { ...emptyRouteCounts(), ...p.routeCounts },
    })),
  }
}

if (typeof window !== 'undefined') {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) state = normalize(JSON.parse(raw) as Partial<GameState>)
  } catch {
    // corrupt or unavailable storage — start fresh
  }
}

function setState(next: GameState) {
  state = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full/unavailable — keep going in memory
  }
  listeners.forEach((listener) => listener())
}

function updatePlayer(id: string, update: (p: Player) => Player) {
  setState({
    ...state,
    players: state.players.map((p) => (p.id === id ? update(p) : p)),
  })
}

/**
 * False during SSR and the hydration render, true once client state
 * (loaded synchronously from localStorage) is in effect. Guards
 * redirects that would misfire on the empty server snapshot.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

export function useGame(): GameState {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    () => state,
    () => EMPTY_STATE,
  )
}

export function setEdition(edition: Edition) {
  setState({ ...state, edition })
}

export function setGlobetrotter(globetrotter: boolean) {
  setState({ ...state, globetrotter })
}

/** Apply a setup-dropdown game variant (edition + expansion in one). */
export function setVariant(variant: GameVariant) {
  setState({
    ...state,
    edition: variant.edition,
    globetrotter: variant.globetrotter,
  })
}

export function addPlayer() {
  if (state.players.length >= EDITION_CONFIG[state.edition].maxPlayers) return
  const used = new Set(state.players.map((p) => p.color))
  const color = TRAIN_COLORS.find((c) => !used.has(c)) ?? TRAIN_COLORS[0]
  const player: Player = {
    id: crypto.randomUUID(),
    name: '',
    color,
    routeCounts: emptyRouteCounts(),
    tickets: [],
    longestPath: false,
    stationsLeft: STARTING_STATIONS,
  }
  setState({ ...state, players: [...state.players, player] })
}

export function removePlayer(id: string) {
  setState({ ...state, players: state.players.filter((p) => p.id !== id) })
}

export function setPlayerName(id: string, name: string) {
  updatePlayer(id, (p) => ({ ...p, name }))
}

export function setPlayerColor(id: string, color: TrainColor) {
  updatePlayer(id, (p) => ({ ...p, color }))
}

export function adjustRouteCount(id: string, length: RouteLength, delta: number) {
  updatePlayer(id, (p) => ({
    ...p,
    routeCounts: {
      ...p.routeCounts,
      [length]: Math.max(0, (p.routeCounts[length] ?? 0) + delta),
    },
  }))
}

export function addTicket(id: string, value: number, completed: boolean) {
  updatePlayer(id, (p) => ({
    ...p,
    tickets: [...p.tickets, { id: crypto.randomUUID(), value, completed }],
  }))
}

export function toggleTicket(id: string, ticketId: string) {
  updatePlayer(id, (p) => ({
    ...p,
    tickets: p.tickets.map((t) =>
      t.id === ticketId ? { ...t, completed: !t.completed } : t,
    ),
  }))
}

export function removeTicket(id: string, ticketId: string) {
  updatePlayer(id, (p) => ({
    ...p,
    tickets: p.tickets.filter((t) => t.id !== ticketId),
  }))
}

export function toggleLongestPath(id: string) {
  updatePlayer(id, (p) => ({ ...p, longestPath: !p.longestPath }))
}

export function adjustStations(id: string, delta: number) {
  updatePlayer(id, (p) => ({
    ...p,
    stationsLeft: Math.min(
      STARTING_STATIONS,
      Math.max(0, p.stationsLeft + delta),
    ),
  }))
}

/** Keep the same players but wipe all scoring for a fresh game. */
export function resetScores() {
  setState({
    ...state,
    players: state.players.map((p) => ({
      ...p,
      routeCounts: emptyRouteCounts(),
      tickets: [],
      longestPath: false,
      stationsLeft: STARTING_STATIONS,
    })),
  })
}

export function resetAll() {
  setState(EMPTY_STATE)
}
