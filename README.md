# AI Receptionist

A multi-tenant AI receptionist businesses drop onto their site with one script tag. It converses
with visitors, answers from the business's own info, books appointments, and captures leads — with
an owner dashboard for it all. Runs entirely on free infrastructure.

```html
<script src="https://<host>/embed.js" data-business-id="<uuid>" defer></script>
```

The snippet (`public/embed.js`) injects a launcher button that opens `/c/<businessId>?embed=1` in an
iframe; the chat only loads on first open. The dashboard's Settings page shows the ready-to-paste tag.

Early project — web chat, booking, leads, dashboard, semantic knowledge base and the embed work end
to end. Self-serve signup and a phone channel are not built yet.

**Slice 1 (this build):** web-chat receptionist + booking + lead capture + owner dashboard,
multi-tenant schema with a seeded demo business. Next: FAQ knowledge base (embeddings), then voice.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Postgres + Drizzle ORM · Groq (free Llama,
via the Vercel AI SDK, tool-calling) · Auth.js + GitHub · Resend · Vitest.

## Architecture

- `lib/db/` — Drizzle schema (multi-tenant, scoped by `businessId`), client, queries, seed.
- `lib/booking/` — pure slot math (`availability.ts`) + transactional booking with an advisory
  lock and overlap guard (`booking.ts`). All date/timezone/conflict logic lives here, not the model.
- `lib/knowledge/` — keyword search over the business's freeform text.
- `lib/ai/` — a thin system prompt + strictly-validated tools (`searchKnowledge`, `checkAvailability`,
  `bookAppointment`, `captureLead`). The app validates every tool call; the model only orchestrates.
- `lib/notify/` — owner email alerts (Resend).
- `app/api/chat/` — streaming route (Groq + tools), persists conversation turns.
- `app/c/[businessId]/` — public chat widget. `app/dashboard/` — authed owner dashboard + settings.

## Setup

1. `cp .env.example .env.local` and fill in:
   - `DATABASE_URL` — a Postgres connection string (Supabase or Neon, free tier).
   - `GROQ_API_KEY` — from https://console.groq.com/keys (free).
   - `AUTH_SECRET` — run `npx auth secret`.
   - `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — a GitHub OAuth app (callback: `/api/auth/callback/github`).
   - `RESEND_API_KEY` — from https://resend.com (free).
2. `npm run db:migrate` — apply the schema.
3. `npm run db:seed` — create the "Bright Smile Dental" demo business.
4. `npm run dev` — open http://localhost:3000 (`/demo` opens the demo receptionist; `/dashboard` is the owner view).

## Testing

`npm test` — Vitest covers the slot/conflict logic, knowledge search, and the tool handlers
(including the safety net that rejects a booking time that isn't an open slot).
