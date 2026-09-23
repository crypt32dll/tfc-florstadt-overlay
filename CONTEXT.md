# Domain context — tfcflorstadt-overlay

Glossary for architecture and seams. Prefer these names over UI or framework jargon.

## Room

A shared live match session identified by `roomId`. Holds PIN hash, `MatchState`, and `updatedAt`. Surfaces: Control (operator phone), Overlay (OBS), Lab (preview).

## MatchState

Authoritative scoreboard / timer / view / SFX blob for one Room. Mutated via `RoomMutation` through server actions; read via store + realtime/poll.

## RoomStore

Persistence **adapter** for Rooms (`memory` | `supabase`). Cron and actions go through this seam — not raw Supabase clients in route handlers.

## Cron job

Vercel-scheduled GET under `/api/cron/*`, authenticated with `CRON_SECRET` (Bearer). Machine consumer only: JSON contract is `CronResult`, narrative lives in server logs — not UI `ActionResult` strings.

## CronResult

Machine envelope for cron responses: `{ ok, skipped?, reason?, error?, …metrics, at? }`. Distinct from `ActionResult` (UI-facing German errors + `data`).
