# Domain context — tfcflorstadt-overlay

Glossary for architecture and seams. Prefer these names over UI or framework jargon.

## Room

A shared live match session identified by `roomId`. Holds PIN hash, `MatchState`, and `updatedAt`. Surfaces: Control (operator phone), Overlay (OBS), Lab (preview).

## MatchState

Authoritative scoreboard / timer / view / SFX blob for one Room. Mutated via `RoomMutation` through server actions; read via store + realtime/poll. Ingress always runs `normalizeState`.

## Match engine

Pure reducer for MatchState: `createInitialState` + `applyMutation` in `src/lib/match/engine.ts`. Migration: `migrate.ts`. Clock formatting: `format.ts`. Scoring rules: `rules.ts`.

## DestinationView

Operator-selectable screens (`startingSoon` | `live` | `standings` | `brb` | `ending`). Mid-sting uses `activeView: "transition"` + `transitionTo`. Catalog: `DESTINATION_VIEWS` / `isShowingView`.

## RoomMutation

Wire + domain mutation contract. Single source: Zod `mutationSchema` → `type RoomMutation`.

## RoomStore

Persistence **adapter** for Rooms (`memory` | `supabase`). Cron and actions go through this seam — not raw Supabase clients in route handlers.

## Control protocol

PIN session + RoomMutation runner (`useControlSession` / `useRoomMutate`): revision/`CONFLICT` resync and `UNAUTHORIZED` handling. Distinct from Control phone UI.

## Cron job

Vercel-scheduled GET under `/api/cron/*`, authenticated with `CRON_SECRET` (Bearer). Machine consumer only: JSON contract is `CronResult`, narrative lives in server logs — not UI `ActionResult` strings.

## CronResult

Machine envelope for cron responses: `{ ok, skipped?, reason?, error?, …metrics, at? }`. Distinct from `ActionResult` (UI-facing German errors + `data`).
