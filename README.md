# Token Radar: pre-token protocols priced by the market's own multiple

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/wuzzstoreservice/token-radar-01-wuzz/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/wuzzstoreservice/token-radar-01-wuzz/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

An entry for make.fun's **Build the best token launch radar** bounty.

It reads the sealed DefiLlama snapshot, ranks every pre-token protocol by an implied value, and
gives each one a farm plan a reader can follow.

## The value model

`implied = round( tvl_usd x multiple x momentum x (0.6 + min(age_days,1095)/1095 x 0.4) )`

Both factors are read from the snapshot, never from a hand-written table:

- **multiple** — the market's TVL-to-market-cap ratio for the protocol's category: the median over
  that category's live-token protocols, shrunk toward the whole market's median (128 live protocols,
  14 categories) in proportion to how few peers the category has.
- **momentum** — `1 + clamp(change_7d - peer_7d, -60, 120)/100 x 0.5`, held in `[0.8, 1.25]`, where
  `peer_7d` is the protocol's category median seven-day growth. A protocol is measured against its
  peers, not against zero: losing 2% while its category loses 8% counts as gaining ground.

So the model prices a pre-token protocol the way the market already prices its peers, then adjusts for
whether it is outgrowing them and for how long it has run with no token at all.

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