# Token Radar: pre-token protocols priced by the market's own multiple

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/wuzzstoreservice/token-radar-01-wuzz/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/wuzzstoreservice/token-radar-01-wuzz/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

An entry for make.fun's **Build the best token launch radar** bounty.

It reads the sealed DefiLlama snapshot, ranks every pre-token protocol by an implied value, and
gives each one a farm plan a reader can follow.

## The value model

`implied = round( tvl_usd x multiple x (1 + clamp(change_7d, -60, 120)/100 x 0.5) x (0.6 + min(age_days,1095)/1095 x 0.4) )`

The `multiple` is the market's own valuation, read from the snapshot and never from a hand-written
table: for each category it is the **median `mcap_usd / tvl_usd`** over that category's live-token
protocols (falling back to the whole market's median when a category has fewer than three
comparables, which is 128 live protocols across 14 categories in this snapshot).

So the model prices a pre-token protocol the way the market already prices its peers, then adjusts
for seven-day growth and for how long the protocol has run with no token at all.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json
```

Writes `out/board.json` (the ranked board), `out/data.js` (the dashboard's data), copies
`dashboard/` and `screenshots/`, and writes `out/dossier.json` with the vendored
`makefun-board.ts` library. Node 22+, standard library only, no network, deterministic.

## What is here

- `main.ts` — the entry point the harness runs.
- `lib/model.ts` — the model: comparables, growth, maturity, the board, farm plans.
- `dashboard/` — the static page (no framework, no network): board, detail drawer, filters.
- `screenshots/` — the board, a detail view and a filtered view.
- `vendor/makefun-board.ts` — make.fun's own dossier library, kept verbatim.

MIT licensed (see `LICENSE`).