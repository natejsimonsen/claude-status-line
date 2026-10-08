import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Reading } from '../types'
import { INITIAL, PALETTE, SEP, readConfig, segments } from './format'
import type { Config } from './format'

const reading = atom({ plugin: 'statline', key: 'reading' } as const, INITIAL as Reading)

// Module variables start over on a hot reload; the reading itself lives in $.state.
let cfg: Config = readConfig({})

const patch = ($: EngineInterface, fn: (r: Reading) => Partial<Reading>) => update($, reading, held => ({ ...held, ...fn(held) }))

async function refreshModel($: EngineInterface) {
  try {
    const model = await $.session.model()
    await patch($, () => ({ model }))
  } catch {
    // keep the last reading
  }
}

async function refreshUsage($: EngineInterface) {
  try {
    const u = await $.session.usage()
    await patch($, () => ({
      tokens: u.context.tokens ?? null,
      window: u.context.window,
    }))
  } catch {
    // keep the last reading
  }
}

export const register: Register = (on, options) => {
  cfg = readConfig(options)

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await refreshModel($)
    await refreshUsage($)
    return started
  })

  // The main loop's requests carry the effort and the model the engine resolved.
  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined) {
      const effort = e.effort === undefined ? null : String(e.effort)
      void patch($, held => (held.effort === effort && held.model === e.model ? {} : { effort, model: e.model }))
    }
    return yield* next(e)
  })

  on('session.measure', async ($, e, next) => {
    await patch($, () => ({
      tokens: e.context.tokens ?? null,
      window: e.context.window,
    }))
    return next(e)
  })

  // After a compact the window is new; the next response fills it in again.
  on('session.compact', async ($, e, next) => {
    const done = await next(e)
    await patch($, () => ({ tokens: null }))
    return done
  }).catch(($, e, next) => next(e))

  // The hint row under the prompt: the engine draws its mode pill, then this row, the engine's hint dimmed at the end.
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    const r = await read($, reading)
    const segs = segments(r, cfg)
    if (segs.length === 0) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box key="statline" flexDirection="row">
        {segs.flatMap((s, i) => [
          i > 0 ? (
            <Text key={`sep-${s.key}`} color={PALETTE.muted}>
              {SEP}
            </Text>
          ) : null,
          <Box key={s.key} flexDirection="row">
            <Text>
              {s.pieces.map((p, j) => (
                <Text key={`${s.key}-${j}`} color={p.color} bold={p.bold === true}>
                  {p.text}
                </Text>
              ))}
            </Text>
          </Box>,
        ])}
        {e.props.hint ? (
          <Box key="hint" flexDirection="row">
            <Text dimColor wrap="truncate-end">
              {SEP}
              {e.props.hint}
            </Text>
          </Box>
        ) : null}
      </Box>
    )
  })
}
