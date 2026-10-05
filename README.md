# Outzy

Find people to do things with — discover plans near you, request to join, and coordinate in-app after the host accepts.

## Live demo

Deploy this repo to [Vercel](https://vercel.com) and set env vars from [`.env.example`](.env.example). Add your production URL to Supabase **Authentication → URL configuration** (redirect URLs for `/feed`, `/onboarding`, `/create-activity`, `/chat/*`).

## Stack

- **Next.js** (App Router) + React
- **Supabase** — Auth (Google OAuth), Postgres, Row Level Security
- **Leaflet** — feed map & location picker
- **Tailwind CSS**

## Core flow (demo script)

Use two Google accounts (or two browsers):

1. **Host (A)** — Sign in → onboarding → **Create activity** → appears on **Feed** under **Yours**.
2. **Guest (B)** — Sign in → **Nearby** → **Message host** on A’s plan → send join request.
3. **Host (A)** — **Yours** → **Requests** (or banner) → read message → **Accept** → opens **chat** with B.
4. **Guest (B)** — Card shows **Open chat** → coordinate time/place.
5. **Host (A)** — **Edit** on card or `/activity/[id]` to update the plan.

## Data model (high level)

| Table | Purpose |
|-------|---------|
| `users` | Profiles (username, bio, city, …) |
| `activities` | Plans with optional lat/lng |
| `activity_requests` | Guest message + pending/accepted/rejected |
| `conversations` | One thread per activity + guest (after accept) |
| `messages` | Chat messages in a conversation |

## Row Level Security (portfolio highlights)

- **`users`** — authenticated read; insert/update own row only ([`20260328130000`](supabase/migrations/20260328130000_users_select_authenticated.sql), [`20260328150000`](supabase/migrations/20260328150000_users_write_own_profile.sql)).
- **`activity_requests`** — guests insert; host/guest read rules; host updates status ([`20260328140000`](supabase/migrations/20260328140000_activity_requests.sql)).
- **`activities`** — authenticated read; host CRUD own rows ([`20260328160000`](supabase/migrations/20260328160000_activities_rls.sql)).
- **`conversations` / `messages`** — only host + guest participants ([`20260328170000`](supabase/migrations/20260328170000_conversations_messages.sql), [`20260328180000`](supabase/migrations/20260328180000_chat_grants_and_backfill_rpc.sql) for grants + backfill RPC, [`20260328190000`](supabase/migrations/20260328190000_messages_realtime.sql) for live message delivery, [`20260328200000`](supabase/migrations/20260328200000_conversation_read_state.sql) for unread badges).

Apply all files in [`supabase/migrations/`](supabase/migrations/) via Supabase SQL Editor or `supabase db push`.

## Local development

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase keys
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `app/feed` — discovery, filters, map, join requests
- `app/chat/[id]` — post-accept messaging
- `app/activity/[id]` — view / edit plan (host)
- `components/feed-activity-card.tsx` — shared activity card UI

## License

Private / portfolio use.
