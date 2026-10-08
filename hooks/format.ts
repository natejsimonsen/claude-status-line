import type { Reading } from '../types'

export type Config = Record<string, never>

export const DEFAULTS: Config = {}

export const INITIAL: Reading = { model: null, effort: null, tokens: null, window: null }

/** The palette: cool and quiet at rest, warming as a figure nears its limit. */
export const PALETTE = {
  model: '#7dcfff',
  effort: '#bb9af7',
  muted: '#565f89',
  cool: '#7aa2f7',
  warm: '#e0af68',
  hot: '#f7768e',
} as const

export function readConfig(_options: Readonly<Record<string, unknown>>): Config {
  return {}
}

/** `claude-fable-5-1` → `Fable 5.1`, `claude-opus-5-5[1m]` → `Opus 5.5`, `Fable 5.1` → `Fable 5.1`, `sonnet` → `Sonnet`. */
export function prettyModel(model: string): string {
  const stripped = model.toLowerCase().replace(/^claude[-\s]/, '').replace(/\[.*$/, '')
  const m = /^([a-z]+)(?:[-\s]+(\d+(?:[-.]\d+)*))?/.exec(stripped)
  if (!m) return model
  const family = m[1]!.charAt(0).toUpperCase() + m[1]!.slice(1)
  const version = m[2]?.replace(/-/g, '.')
  return version ? `${family} ${version}` : family
}

/** 950 → `950`, 8400 → `8.4k`, 154000 → `154k`, 1_000_000 → `1.0M`. */
export function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n < 1000) return String(Math.round(n))
  const k = n / 1000
  return k >= 100 ? `${Math.round(k)}k` : `${k.toFixed(1).replace(/\.0$/, '')}k`
}

/** Blue while there is room, amber past half, red past four fifths. */
export function heat(fraction: number): string {
  if (fraction >= 0.8) return PALETTE.hot
  if (fraction >= 0.5) return PALETTE.warm
  return PALETTE.cool
}

/** One segment of the row: pieces of text, each with its own color, drawn in order. */
export type Piece = { text: string; color: string; bold?: boolean }
export type Segment = { key: string; pieces: Piece[] }

/** The row's segments, left to right. Empty when nothing is known yet. */
export function segments(r: Reading, _cfg: Config): Segment[] {
  const out: Segment[] = []
  if (r.model !== null) out.push({ key: 'model', pieces: [{ text: prettyModel(r.model), color: PALETTE.model, bold: true }] })
  if (r.effort !== null) out.push({ key: 'effort', pieces: [{ text: r.effort, color: PALETTE.effort }] })
  if (r.window !== null) {
    const fraction = r.tokens !== null ? r.tokens / r.window : 0
    out.push({
      key: 'context',
      pieces: [
        { text: r.tokens !== null ? fmtK(r.tokens) : '–', color: r.tokens !== null ? heat(fraction) : PALETTE.muted },
        { text: `/${fmtK(r.window)}`, color: PALETTE.muted },
      ],
    })
  }
  return out
}

export const SEP = ' · '

/** The row as plain text, for tests and for a surface without color. */
export function plainText(segs: Segment[]): string {
  return segs.map(s => s.pieces.map(p => p.text).join('')).join(SEP)
}
