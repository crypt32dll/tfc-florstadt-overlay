# TFC Florstadt Stream Overlay

Twitch/OBS Scoreboard for [Tischfußball Club Florstadt](https://www.tfc-florstadt.de/).

- **Preview Lab** – test without Twitch or OBS
- **Control** – mobile web app (PIN) for goals, timer, screens
- **Overlay** – transparent 1920×1080 browser source for OBS

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
3. Set env vars (see `.env.example`) on Vercel / `.env.local`
4. Set a strong `ROOM_SESSION_SECRET` (≥ 32 characters)

### Wake up before match day

Supabase **Free** projects pause after ~7 days of inactivity. Before streaming:

1. Open the [Supabase Dashboard](https://supabase.com/dashboard)
2. If the project shows **Paused** → **Restore / Resume**
3. Wait 1–2 minutes, reload Lab/Control/Overlay

## OBS Studio

1. Source → **Browser**
2. URL: `https://YOUR_DOMAIN/overlay/ROOM_ID`
3. Width **1920**, Height **1080**
4. Uncheck “Shutdown source when not visible”
5. Custom CSS (recommended):

```css
body { background-color: rgba(0,0,0,0) !important; margin: 0 !important; overflow: hidden !important; }
```

## Security

- Overlay/Lab: public read
- Control: PIN required (hashed at rest), httpOnly session cookie
- Mutations only via Server Actions with session check
- Do not show the PIN on stream

## Routes

| Path | Purpose |
|------|---------|
| `/` | Create room |
| `/lab/[roomId]` | Preview without Twitch |
| `/control/[roomId]` | Mobile control (PIN) |
| `/overlay/[roomId]` | OBS browser source |

## Scripts

```bash
npm run dev
npm run build
npm run start
```
# tfc-florstadt-overlay
