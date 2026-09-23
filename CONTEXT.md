# Domain context — tfcflorstadt-overlay

Glossary for architecture and seams. Prefer these names over UI or framework jargon.

## Room

A shared live match session identified by `roomId`. Holds PIN hash, `MatchState`, and `updatedAt`. Surfaces: Control (operator phone), Overlay (OBS), Lab (preview).

## MatchState

Authoritative scoreboard / timer / view / SFX blob for one Room. Mutated via `RoomMutation` through server actions; read via store + realtime/poll. Ingress always runs `normalizeState` (actions + `useRoomState`); leaves assume clean state.

## Match engine

Pure reducer for MatchState: `createInitialState` + `applyMutation` in `src/lib/match/engine.ts`. Migration: `migrate.ts`. Clock formatting: `format.ts`. Scoring rules: `rules.ts`. Engine does not re-migrate.

## DestinationView

Operator-selectable screens. Zod-owned: `DESTINATION_VIEWS` / `destinationViewSchema` → `type DestinationView`. Mid-sting uses `activeView: "transition"` + `transitionTo`. Catalog helpers: `displayView` / `isShowingView`.

## MatchFormat

`bestOf3` | `bestOf5`. Zod-owned via `matchFormatSchema`.

## RoomMutation

Wire + domain mutation contract. Single source: Zod `mutationSchema` → `type RoomMutation`. Overlay copy uses one `setOverlayMessage` with `slot`.

## RoomStore

Persistence **adapter** for Rooms (`memory` | `supabase`). Cron and actions go through this seam — not raw Supabase clients in route handlers. Optimistic concurrency: `saveIfRevision` (CAS on `MatchState.revision`).

## Control protocol

PIN session + RoomMutation runner (`useControlSession` / `useRoomMutate`): revision/`CONFLICT` resync and `UNAUTHORIZED` handling. Distinct from Control phone UI. Maps `ActionResult` codes to German via `actionErrorMessage`.

## ActionResult

UI-facing server-action envelope: `{ ok: true, data }` | `{ ok: false, code, message? }`. Machine codes (`CONFLICT`, `UNAUTHORIZED`, …); German copy only at the Control / form edge. Distinct from `CronResult`.

## Cron job

Vercel-scheduled GET under `/api/cron/*`, authenticated with `CRON_SECRET` (Bearer). Machine consumer only: JSON contract is `CronResult`, narrative lives in server logs — not UI `ActionResult` strings.

## CronResult

Machine envelope for cron responses: `{ ok, skipped?, reason?, error?, …metrics, at? }`. Distinct from `ActionResult`.
