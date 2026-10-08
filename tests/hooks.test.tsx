import { expect, mock, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

const PROPS = { isDraft: false, isWorking: false, hint: '? for shortcuts' } as const

type Sandbox = Parameters<TestBody>[0]
type On = Parameters<TestBody>[1]

/** The engine beneath the mod: model and usage answers, and the engine's own hint row. */
function world($: Sandbox, on: On) {
  const clock = mock.clock(on, { now: 1 })
  mock.store(on)

  on('ui.log', async () => ({ value: undefined }))
  on('session.model', async () => ({ value: 'claude-fable-5-1' }))
  on('session.usage', async () => ({ value: { startedAt: 1, rateLimits: [], context: { window: 1_000_000 } } }))
  on('session.start', async (_, e) => ({ cwd: e.cwd }))
  on('session.measure', async (_, e) => ({ changed: e.changed }))
  on('ui.render', async ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box key="engine" />
  })

  const start = async () => {
    await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
    await clock.settle()
  }
  const measure = async () => {
    await $.session.measure({
      context: { window: 1_000_000, tokens: 275_000, percent: 28 },
      rateLimits: [{ kind: 'five_hour', percentUsed: 4 }],
      cost: { usd: 7.66 },
      changed: ['context', 'rateLimits', 'cost'],
    } as Parameters<typeof $.session.measure>[0])
    await clock.settle()
  }
  const mount = (surface: 'terminal' | 'desktop' = 'terminal', props: object = PROPS) =>
    $.ui.mount({ plugin: 'statline', surface, component: 'PromptHint', props: props as never } as never)
  const text = async (ui: Awaited<ReturnType<typeof mount>>, key: string) => (await ui.find({ key }))?.text
  return { start, measure, mount, text }
}

test('the row shows model and window at start, then tokens after a measurement, on both surfaces', async ($, on) => {
  const t = world($, on)
  await t.start()
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await t.mount(surface)
    expect(await t.text(ui, 'model')).toBe('Fable 5.1')
    expect(await t.text(ui, 'context')).toBe('–/1.0M')
  }
  await t.measure()
  const ui = await t.mount()
  expect(await t.text(ui, 'context')).toBe('275k/1.0M')
  expect(await ui.find({ key: 'usage' })).toBeUndefined()
})

test('the engine hint rides dimmed at the end of the same row, and an empty hint draws nothing', async ($, on) => {
  const t = world($, on)
  await t.start()
  let ui = await t.mount()
  expect(await t.text(ui, 'hint')).toBe(' · ? for shortcuts')
  ui = await t.mount('terminal', { ...PROPS, hint: '' })
  expect(await ui.find({ key: 'hint' })).toBeUndefined()
})

test('with nothing known the row yields to the engine', async ($, on) => {
  const t = world($, on)
  const ui = await t.mount()
  expect(await ui.find({ key: 'model' })).toBeUndefined()
})
