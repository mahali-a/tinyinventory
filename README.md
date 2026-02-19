# Tiny Inventory

Tiny inventory management system. Tracks stores and the products they carry.

## Running it

```bash
docker compose up --build
```

App: http://localhost:5173  
Swagger: http://localhost:3000/docs

The server seeds 5 stores and 35 products on first boot so there's data to interact with immediately.

### Without Docker

```bash
pnpm install
pnpm db:seed
pnpm dev
```

## API overview

```
GET    /api/dashboard/metrics        aggregated stats for the dashboard

GET    /api/stores                   list (q, status, sort, page, limit)
POST   /api/stores                   create
GET    /api/stores/:id               detail + product summary
PATCH  /api/stores/:id               partial update
DELETE /api/stores/:id               delete (cascades to products)

GET    /api/products                 list (q, category, status, storeId, minPrice, maxPrice, sort, page, limit)
POST   /api/products                 create (status is auto-derived from quantity vs minStock)
GET    /api/products/:id             detail with store name joined
PATCH  /api/products/:id             partial update
DELETE /api/products/:id             delete
```

## Decisions & trade-offs

**Fastify over Express** — the spec mentioned Express but Fastify's plugin system and `fastify-type-provider-zod` let one Zod schema drive validation, TypeScript types, and the OpenAPI spec. That spec is what generates the frontend client, so a breaking server change shows up as a compile error rather than a silent runtime failure.

**SQLite + Drizzle** — simple, no extra Docker container, and the DB file lives in a named volume. I would swap for Postgres in production without much friction since Drizzle abstracts the dialect.

**Generated API client (`@hey-api/openapi-ts`)** — points at the server's OpenAPI spec and generates a typed SDK, TanStack Query hooks, and all request/response types. Nothing in `web/src/api/` is written by hand, so frontend types are never out of date.

**URL as filter state** — all filters, search, sort, and pagination live in the URL via TanStack Router's `validateSearch`. Links are shareable, the browser back button works correctly, and there's no separate state layer to keep in sync.

**ShadCN/ui + Tailwind v4** — I prefer owning the component source. I used the `dashboard-01` block as the layout shell and built everything else by hand.

## Future improvements

1. **Inventory history** — updating quantity works but there's no record of when or by how much. A simple audit log table (`product_id`, `delta`, `reason`, `timestamp`) would make stock changes traceable and give the dashboard something more useful to show than a snapshot.
2. **Persist column visibility** — the column toggle resets on every page refresh because it's in `useState`. Storing it in `localStorage` is a small change but the kind of thing users notice.
3. **E2E tests** — a Playwright suite covering the main flows: dashboard load, filtering and paginating, editing a product, and deleting a store.
4. **Bulk actions** — multi-select on the products table to restock or reassign several items at once.
5. **Auth** — a simple admin/viewer split with a JWT in an HttpOnly cookie, middleware guards on mutating routes, and edit/delete controls hidden for viewers.

## Project structure

```
server/src/
  features/    route + service + schema per domain
  db/          Drizzle schema, client, seed
  plugins/     cors, swagger, error handler
  utils/       typed error classes

web/src/
  api/         generated SDK + TanStack Query hooks (don't edit by hand)
  components/  shared UI and shadcn primitives
  hooks/       debounce, mobile detection, back navigation
  lib/         api error helper, category constants, cn util
  routes/      one file per screen
```
