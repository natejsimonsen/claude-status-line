import { expect, test } from 'claude-code/testing'

import { DEFAULTS, INITIAL, PALETTE, fmtK, heat, plainText, prettyModel, readConfig, segments } from '../hooks/format'

test('prettyModel reads as /model shows it', () => {
  expect(prettyModel('claude-fable-5-1')).toBe('Fable 5.1')
  expect(prettyModel('claude-opus-5-5[1m]')).toBe('Opus 5.5')
  expect(prettyModel('Fable 5.1')).toBe('Fable 5.1')
  expect(prettyModel('sonnet')).toBe('Sonnet')
})

test('fmtK', () => {
  expect(fmtK(950)).toBe('950')
  expect(fmtK(8_400)).toBe('8.4k')
  expect(fmtK(154_000)).toBe('154k')
  expect(fmtK(1_000_000)).toBe('1.0M')
})

test('heat', () => {
  expect(heat(0.27)).toBe(PALETTE.cool)
  expect(heat(0.5)).toBe(PALETTE.warm)
  expect(heat(0.8)).toBe(PALETTE.hot)
})

test('segments in order, and as plain text', () => {
  expect(segments(INITIAL, DEFAULTS)).toEqual([])
  const full = { model: 'claude-fable-5-1', effort: 'high', tokens: 275_000, window: 1_000_000 }
  const segs = segments(full, DEFAULTS)
  expect(segs.map(s => s.key)).toEqual(['model', 'effort', 'context'])
  expect(plainText(segs)).toBe('Fable 5.1 · high · 275k/1.0M')
  expect(plainText(segments({ ...full, tokens: null }, DEFAULTS))).toContain('–/1.0M')
})

test('readConfig takes no options', () => {
  expect(readConfig({})).toEqual(DEFAULTS)
  expect(readConfig({ showUsage: false })).toEqual(DEFAULTS)
})
