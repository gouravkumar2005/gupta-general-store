# Gupta General & Confectionary Store — Demo

A website + WhatsApp bot for the store, sharing one backend/database so an order placed on either
channel shows up in the same customer's order history, and a website order automatically triggers a
WhatsApp confirmation message. See `bhai-phele-suno-ye-kind-sundae.md` (in `~/.claude/plans/`) for the
full plan and roadmap. This is the **demo build**: ~60 sample products across 7 categories, not the
real 5000+ SKU catalog (that comes later via bulk import, once this demo is approved).

## Project layout

```
apps/
  api/            Express + TypeScript + Prisma backend (shared by web + bot)
  web/            Next.js customer website + admin panel (/admin)
  whatsapp-bot/   whatsapp-web.js bot service, talks to the API over HTTP
packages/
  shared/         Phone-number normalization (the identity glue between channels)
```

## One-time setup

```
npm install --include=dev
cd apps/api
npx prisma migrate dev --name init   # creates apps/api/prisma/dev.db (SQLite)
npm run seed                         # loads the ~60 sample products
cd ../..
```

> **Why SQLite, not Postgres?** The plan calls for Postgres in production (see `docker-compose.yml`
> for a ready-to-use Postgres container). For this local demo, Docker Desktop wasn't available in the
> build environment, so the schema currently targets SQLite instead (zero extra infra to run the demo).
> Switching back to Postgres later is a one-line change in `apps/api/prisma/schema.prisma`
> (`provider = "postgresql"`) plus restoring `DATABASE_URL` in `apps/api/.env` to point at a real
> Postgres instance (`docker compose up -d db` once Docker Desktop is working) — the rest of the code
> doesn't change.

## Running it

Three processes, each in its own terminal (or use the npm scripts from the repo root):

```
npm run dev:api    # http://localhost:4000  - backend
npm run dev:web    # http://localhost:3000  - website + /admin
npm run dev:bot    # WhatsApp bot - prints a QR code to scan
```

- **Website:** http://localhost:3000 — browse categories, search, add to cart, checkout with a phone
  number (identifies/creates the customer), view order history at `/orders`.
- **Admin panel:** http://localhost:3000/admin — view orders and mark them Delivered, add
  products/categories. (No login yet — fine for a local demo, add auth before this goes public.)
- **WhatsApp bot:** run `npm run dev:bot`, scan the printed QR code with the **dedicated demo WhatsApp
  number** (not a personal number — see the risk notes in the plan). Message it "hi" to get the menu:
  browse by category, search, cart, checkout, and reorder from past orders.

## Proving the cross-channel link (the demo's core "wow" moment)

1. Place an order on the website (any phone number, e.g. your own) → within a few seconds the
   WhatsApp bot process sends that number a confirmation message ("Order placed... it will reach you
   soon").
2. Message the bot from WhatsApp and place an order through it → open `/orders` on the website with
   the same phone number → the WhatsApp order appears in the same history.
3. Open `/admin` → both orders are listed there regardless of which channel they came from, each
   tagged with its channel; mark one Delivered and its status updates everywhere.

## What's deliberately out of scope for this demo

Per the plan, these are intentionally deferred until after the client approves the demo:
online payment (Razorpay), the real 5000+ SKU catalog + bulk import tool, GST invoicing, and
admin login/roles. Details and rationale are in the plan file.
