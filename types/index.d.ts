/** Everything the row is drawn from. Written by the hooks, read by the render hook. */
export type Reading = {
  /** The main loop's model as the engine names it; null before the first read. */
  model: string | null
  /** The last main-loop request's effort; null for a model without one. */
  effort: string | null
  /** The context window's last reading: input tokens of the last response, and the model's window. */
  tokens: number | null
  window: number | null
}

declare module 'claude-code' {
  interface PluginState {
    statline: { reading: Reading }
  }
}
