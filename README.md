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

| Surface | Path | Who uses it |
| --- | --- | --- |
| Preview Lab | `/lab/[roomId]` | Laptop, without Twitch or OBS |
| Control | `/control/[roomId]` | Phone (PIN, installable as a PWA) |
| Overlay | `/overlay/[roomId]` | OBS browser source |

Creating a room on `/` issues a 4-digit PIN. Control stores a hashed PIN and an httpOnly session cookie. Overlay and Lab only receive match state.

Without Supabase env vars the app keeps rooms in memory. With Supabase, Lab, Control, and Overlay stay in sync through Realtime, and fall back to polling if the channel drops.

> [!NOTE]
> The operator UI is German. Overlay copy (Starting Soon, BRB, ending) is editable from Control.

## Features

- Live scorebug, Starting Soon, standings, BRB, and ending screens
- Logo sting between screens (Three.js, about 2 seconds)
- Goals, undo, team names, side swap, and a match clock
- Best of 3 or best of 5, with the club lineup **2D · 2E · 2D · 2E · 2D**
- Set and session totals, plus a history of finished games
- Overlay sounds for a goal, a finished set, and a screen change (Web Audio in the OBS source)
- QR code in the Lab so the phone opens Control on the same room

## Getting started

You need [Node.js 20+](https://nodejs.org/) and npm. CI runs on Node.js 24.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create a room, and note the PIN. Open **Preview Lab** on the laptop. Open Control in another tab, or on a phone, and enter the PIN.

> [!IMPORTANT]
> The in-memory store lives in the Node process. Lab and Control must use the **same host**. On a phone, open the laptop’s LAN address (`http://192.168.x.x:3000`), not `localhost`.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Vitest |
| `npm run lint` | Biome check |
| `npm run format` | Biome format |

## Supabase

Use Supabase when more than one machine must share a room, or when you deploy.

1. Create a project at [supabase.com](https://supabase.com).
2. Run [`supabase/migrations/001_rooms.sql`](supabase/migrations/001_rooms.sql) in the SQL editor.
3. Run [`supabase/migrations/002_hide_pin_hash.sql`](supabase/migrations/002_hide_pin_hash.sql) so anon clients cannot read `pin_hash`.
4. Copy [`.env.example`](.env.example) to `.env.local` (local) or set the same variables on Vercel.

| Variable | Role |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Realtime read of `id`, `state`, `updated_at` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only writes |
| `ROOM_SESSION_SECRET` | Signs the Control session. At least 32 characters in production |
| `CRON_SECRET` | Authorizes the Vercel cron routes. At least 16 characters |

Leave the Supabase variables empty for the in-memory store.

### Keep the free project awake

[`vercel.json`](vercel.json) schedules two jobs (UTC):

| Cron | Schedule | Purpose |
| --- | --- | --- |
| `/api/cron/keep-alive` | `0 8 * * *` | Daily database ping |
| `/api/cron/cleanup-rooms` | `30 8 * * *` | Delete rooms idle for more than 7 days |

Deploy to Vercel, set `CRON_SECRET`, and confirm the jobs under **Project → Settings → Cron Jobs**. Vercel sends `Authorization: Bearer <CRON_SECRET>`.

If the Supabase project is already paused, resume it from the [dashboard](https://supabase.com/dashboard) and wait a minute or two.

## OBS Studio

1. Add a **Browser** source.
2. URL: `https://YOUR_DOMAIN/overlay/ROOM_ID` (copy it from the Lab).
3. Width **1920**, height **1080**.
4. Turn off “Shutdown source when not visible”.
5. Turn **audio** on for that source so goal, set, and screen sounds play.
6. Custom CSS:

```css
body {
  background-color: rgba(0, 0, 0, 0) !important;
  margin: 0 !important;
  overflow: hidden !important;
}
```

> [!WARNING]
> Do not put Preview Lab on camera while the PIN is visible. The overlay URL itself does not show the PIN.

## Match rules

A set is played to 5 with a two-goal lead, and ends at 7–6 at the latest. Best of 3 needs 2 sets. Best of 5 needs 3. Finishing a set advances the lineup (Doppel or Einzel) and adds the set to the session total.

Control can correct a goal, reset the clock, swap sides, and jump to a lineup slot. Screen changes play the logo sting, then land on the chosen view.

## Security

- Overlay and Lab read match state only. After migration 002, `pin_hash` is not granted to the anon key.
- Inserts and updates go through Next.js server actions with the service role, never from the browser.
- Control requires the PIN. The session cookie is httpOnly. Mutations check that session and can reject a stale revision.
- Cron routes reject requests that do not match `CRON_SECRET`.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Biome, Vitest. Optional persistence is Supabase. Hosting target is Vercel Hobby plus the Supabase free tier.
