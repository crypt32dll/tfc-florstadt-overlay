# TFC Florstadt Stream Overlay

Twitch/OBS Scoreboard for [Tischfußball Club Florstadt](https://www.tfc-florstadt.de/).

- **Preview Lab** – test without Twitch or OBS
- **Control** – mobile web app (PIN) for goals, timer, screens (PWA-installable)
- **Overlay** – transparent 1920×1080 browser source for OBS (SFX via Web Audio)

## Stack

- Next.js 16 + TypeScript + Tailwind
- Free tier: Vercel Hobby + optional Supabase Free
- Without Supabase env vars → in-memory store (local laptop testing)

## Quick start (local, no Supabase)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create a room, open **Preview Lab**, use Control in another tab (or phone – see note below).

### Phone + Memory store

The phone must reach your laptop. Use the LAN IP, e.g. `http://192.168.x.x:3000`, not `localhost` on the phone. Both Lab and Control must use that same host so they share the memory store.

## Supabase (production / Realtime)

1. Create a free project at [supabase.com](https://supabase.com)
2. Run SQL from [`supabase/migrations/001_rooms.sql`](supabase/migrations/001_rooms.sql)
3. Run [`supabase/migrations/002_hide_pin_hash.sql`](supabase/migrations/002_hide_pin_hash.sql) (hides `pin_hash` from anon)
4. Set env vars (see `.env.example`) on Vercel / `.env.local`
5. Set a strong `ROOM_SESSION_SECRET` (≥ 32 characters) and `CRON_SECRET`

### Keep Supabase Free awake + room cleanup (Vercel Cron)

| Cron | Schedule (UTC) | Purpose |
|------|----------------|---------|
| `/api/cron/keep-alive` | `0 8 * * *` | Daily DB ping (avoid Free pause) |
| `/api/cron/cleanup-rooms` | `30 8 * * *` | Delete rooms idle &gt; 7 days |

1. Deploy to Vercel (Hobby is fine – crons once per day)
2. Set `CRON_SECRET` in the Vercel project env (≥ 16 random chars)
3. Check **Project → Settings → Cron Jobs**

If the project is already **Paused**: [Supabase Dashboard](https://supabase.com/dashboard) → **Restore / Resume**, wait 1–2 minutes.

## OBS Studio

1. Source → **Browser**
2. URL: `https://YOUR_DOMAIN/overlay/ROOM_ID` (copy from Lab)
3. Width **1920**, Height **1080**
4. Uncheck “Shutdown source when not visible”
5. Enable **audio** on the browser source (overlay SFX: goal / view switch / set)
6. Custom CSS (recommended):

```css
body { background-color: rgba(0,0,0,0) !important; margin: 0 !important; overflow: hidden !important; }
```

Do **not** put Preview Lab on camera if the PIN is revealed.

## Security

- Overlay/Lab: public read of `state` only (`pin_hash` revoked for anon after migration 002)
- Control: PIN required (hashed at rest), httpOnly session cookie
- Mutations via Server Actions with session + optional revision conflict check
- Do not show the PIN on stream

## Routes

| Path | Purpose |
|------|---------|
| `/` | Create room |
| `/lab/[roomId]` | Preview without Twitch |
| `/control/[roomId]` | Mobile control (PIN) |
| `/overlay/[roomId]` | OBS browser source |
| `/api/cron/keep-alive` | Daily Supabase ping |
| `/api/cron/cleanup-rooms` | Delete stale rooms |

## Scripts

```bash
npm run dev
npm run build
npm run start
npm test
```
