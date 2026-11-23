<p align="center">
  <img src="public/brand/tfc-florstadt-logo.png" alt="Tischfußball Club Florstadt" width="160" />
</p>

# TFC Florstadt Stream Overlay

[![CI](https://github.com/crypt32dll/tfc-florstadt-overlay/actions/workflows/ci.yml/badge.svg)](https://github.com/crypt32dll/tfc-florstadt-overlay/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-20+-3c873a?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)

Scoreboard for [Tischfußball Club Florstadt](https://www.tfc-florstadt.de/) streams. A phone controls the match. OBS shows a transparent 1920×1080 overlay.

[Overview](#overview) • [Getting started](#getting-started) • [Supabase](#supabase) • [OBS](#obs-studio) • [Match rules](#match-rules)

## Overview

One room has three surfaces:

| Surface     | Path                | Who uses it                   |
| ----------- | ------------------- | ----------------------------- |
| Preview Lab | `/lab/[roomId]`     | Laptop, without Twitch or OBS |
| Control     | `/control/live`     | Phone (club PIN)              |
| Overlay     | `/overlay/live`     | OBS browser source            |

Creating a room on `/` sets the live pointer so `/overlay/live` and `/control/live` follow the latest room. Control uses a **club-wide PIN** (`CONTROL_PIN` / `NEXT_PUBLIC_CONTROL_PIN`) and an httpOnly session cookie. Overlay and Lab only receive match state.

Without Supabase env vars the app keeps rooms in memory. With Supabase, Lab, Control, and Overlay stay in sync through Realtime, and fall back to polling if the channel drops.

> [!NOTE]
> The operator UI is German. Overlay copy (Starting Soon, BRB, ending) is editable from Control.

## Features

- Live scorebug, Starting Soon, standings, BRB, and ending screens
- Logo sting between screens (Three.js, about 2 seconds)
- Goal lower-third banner + optional `/public/sfx/*.mp3` (else Web Audio)
- Goals, undo, team names, side swap, match clock, lineup jump, mid-match colors
- Best of 3 or best of 5, club lineup **2D · 2E · 2D · 2E · 2D**
- Opponent picker from [Verbandsliga Süd](https://tfvh.de/index.php/verbandsliga-sued) (names + crests under `public/crests`, `pnpm sync:crests`)
- Set and session totals, history, new-match / next opponent without a new room
- QR code in the Lab so the phone opens Control on the live room

## Getting started

You need [Node.js 20+](https://nodejs.org/) and [pnpm](https://pnpm.io/). CI runs on Node.js 24.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and create a room. Open **Preview Lab** on the laptop and scan the QR with your phone — Control unlocks via the club PIN in the QR link.

> [!IMPORTANT]
> The in-memory store lives in the Node process. Lab and Control must use the **same host**. On a phone, open the laptop’s LAN address (`http://192.168.x.x:3000`), not `localhost`.

### Scripts

| Command                        | Purpose                     |
| ------------------------------ | --------------------------- |
| `pnpm dev`                     | Next.js dev server          |
| `pnpm build` / `pnpm start`    | Production build and server |
| `pnpm test`                    | Vitest                      |
| `pnpm lint`                    | Biome check                 |
| `pnpm format`                  | Biome format                |

## Supabase

Use Supabase when more than one machine must share a room, or when you deploy.
1. Create a project at [supabase.com](https://supabase.com).
2. Run [`supabase/migrations/001_rooms.sql`](supabase/migrations/001_rooms.sql) in the SQL editor.
3. Run [`supabase/migrations/002_hide_pin_hash.sql`](supabase/migrations/002_hide_pin_hash.sql) so anon clients cannot read `pin_hash`.
4. Run [`supabase/migrations/003_stream_pointer.sql`](supabase/migrations/003_stream_pointer.sql) for the `/overlay/live` master URL.
5. Copy [`.env.example`](.env.example) to `.env.local` (local) or set the same variables on Vercel.

| Variable                        | Role                                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project URL                                                                                                                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Realtime read of `id`, `state`, `updated_at`                                                                                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-only writes                                                                                                            |
| `ROOM_SESSION_SECRET`           | Signs the Control session. At least 32 characters in production                                                               |
| `CONTROL_PIN`                   | Club PIN for Control (server). 4–6 digits                                                                                     |
| `NEXT_PUBLIC_CONTROL_PIN`       | Same PIN for Lab QR / Control auto-unlock                                                                                     |
| `CRON_SECRET`                   | Authorizes `/api/cron/*` (GitHub Actions cron). At least 16 characters                                                        |
| `NEXT_PUBLIC_SITE_URL`          | Optional canonical origin for OG/share links (e.g. `https://overlay.example.com`). On Vercel, production URL is used if unset |

Leave the Supabase variables empty for the in-memory store.

### Keep the free project awake

GitHub Actions [`.github/workflows/cron.yml`](.github/workflows/cron.yml) calls the cleanup route daily (08:00 UTC):

| Route                     | Schedule    | Purpose                                           |
| ------------------------- | ----------- | ------------------------------------------------- |
| `/api/cron/cleanup-rooms` | `0 8 * * *` | Delete rooms idle >7d (also keeps Supabase awake) |

Set repo secret `CRON_SECRET` (same value as on Vercel) and optional variable `APP_URL` (defaults to the production Vercel URL). The workflow sends `Authorization: Bearer <CRON_SECRET>`.

If the Supabase project is already paused, resume it from the [dashboard](https://supabase.com/dashboard) and wait a minute or two.

## OBS Studio

1. Add a **Browser** source.
2. URL: `https://YOUR_DOMAIN/overlay/live` (stable master URL — always the latest created room; copy from the Lab).
3. Width **1920**, height **1080**.
4. Turn off “Shutdown source when not visible”.
5. Turn **audio** on for that source so goal, set, and screen sounds play.

The overlay page already paints a transparent `html`/`body` — no Custom CSS in OBS. Per-room URLs (`/overlay/ROOM_ID`) still work for previews.

Creating a new room while a live room exists asks for confirmation before retargeting `/overlay/live`.

> [!WARNING]
> Do not put Preview Lab on camera while the PIN is visible. The overlay URL itself does not show the PIN.

## Match rules

Normal sets are first to 5 (including 5–4). A deciding set (Bo3 at 1–1, Bo5 at 2–2) needs a two-goal lead from 5, continues after 4–4 until two ahead, and caps at 8–7. Best of 3 needs 2 sets; best of 5 needs 3. Finishing a game advances the lineup (Doppel or Einzel) and adds it to the session total. The last lineup slot finishes the matchday and opens the Ending screen.

Control can correct a goal, edit past games, reset the clock, swap sides (including standings history), pick kicker colors, jump to a lineup slot, and start a new match against another opponent. Screen changes play the logo sting, then land on the chosen view.

## Security

- Overlay and Lab read match state only. After migration 002, `pin_hash` is not granted to the anon key (`pin_hash` is legacy column filled on create; auth uses `CONTROL_PIN`).
- Inserts and updates go through Next.js server actions with the service role, never from the browser.
- Control requires the club PIN. The session cookie is httpOnly. Mutations check that session and can reject a stale revision (Control queues + retries conflicts).
- Cron routes reject requests that do not match `CRON_SECRET`.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Biome, Vitest, pnpm. Optional persistence is Supabase. Hosting target is Vercel Hobby plus the Supabase free tier.
