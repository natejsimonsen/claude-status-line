# statline

A quiet one-row status under the prompt for Claude Code, as a mod. It replaces a
`statusLine` command with a row the engine redraws on events, not on a poll,
and each segment carries its own color.

```
⏵⏵ auto mode on · Fable 5.1 · high · 275k/1.0M · ← 1 agent · ? for shortcuts
```

The engine draws its mode pill first. Then, left to right: model, effort, and
context tokens over the window. The engine's own hint text follows, dimmed. The
token count shifts from blue to amber past half the window and to red past four
fifths.

Model and window show at start. Tokens arrive after the first response.

## Install

In a Claude Code session:

```
/plugin install statline --marketplace natejsimonsen/claude-status-line
```

Answer `y` to add the marketplace, then pick the user scope. The row appears
in that session and in every session after. Requires Claude Code 2.1.287 or
later. If a `statusLine` command is set in settings.json, remove it so the two
don't stack.

## Run from a checkout

```
claude --plugin-dir /path/to/claude-status-line
```

## Check

```
claude plugin validate .
claude plugin test .
```
