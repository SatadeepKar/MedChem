# AASA MedChem — Inventory & Order Management

A full-stack inventory and order management web application built for AASA MedChem. Tracks chemical stock, manages procurement orders, and supports multi-role access (Admin + Seller).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Neon PostgreSQL (serverless) |
| ORM | Drizzle ORM + drizzle-kit |
| Auth | NextAuth.js v5 (beta) + credentials provider |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Zustand (cart) |
| Deployment | Vercel |

---

## Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto-generated |
| name | text | |
| email | text UNIQUE | |
| password_hash | text | bcrypt |
| role | text | `'admin'` or `'seller'` |
| created_at | timestamptz | |

### `categories`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text UNIQUE | |
| description | text | optional |

### `products`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | |
| sku | text UNIQUE | format: `CAT-YYYYMMDD-XXXX` |
| description | text | optional |
| category_id | uuid FK categories | nullable |
| base_unit | text | `g`, `mL`, or `unit` |
| base_price_per_unit | numeric(20,8) | INR per base unit |
| stock_quantity | numeric(20,8) | stored in base unit |
| low_stock_threshold | numeric(20,8) | alert when below |
| is_active | boolean | soft-delete flag |
| created_at / updated_at | timestamptz | |

### `orders`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| order_number | text UNIQUE | `ORD-YYYY-NNNN` |
| user_id | uuid FK users | seller who placed it |
| status | text | draft, pending, confirmed, fulfilled, cancelled |
| notes | text | optional |
| total_amount | numeric(20,8) | INR |
| created_at / updated_at | timestamptz | |

### `order_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| order_id | uuid FK orders CASCADE | |
| product_id | uuid FK products | |
| ordered_unit | text | unit the seller chose (e.g. `kg`) |
| ordered_quantity | numeric(20,8) | in `ordered_unit` |
| base_quantity | numeric(20,8) | converted to `base_unit` |
| unit_price_at_order | numeric(20,8) | INR per base unit at time of order |
| line_total | numeric(20,8) | `base_quantity x unit_price_at_order` |

---

## Unit Conversion Strategy

All prices and stock quantities are stored in **base units**:

| Dimension | Base Unit | Supported Units |
|-----------|-----------|----------------|
| Weight | `g` | `g`, `kg` (x1000), `mg` (x0.001) |
| Volume | `mL` | `mL`, `L` (x1000), `uL` (x0.001) |
| Count | `unit` | `unit`, `dozen` (x12), `pack` (x1) |

When a seller orders `2 kg` of a product with base unit `g`:
1. `convertToBase(2, 'kg')` yields `2000 g` stored as `base_quantity`
2. `line_total = 2000 x base_price_per_g`
3. Displayed as: `2 kg x Rs X/kg = Rs Y`

All conversion logic lives in `lib/units.ts`.

---

## Local Setup

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/your-org/aasa-medchem.git
cd aasa-medchem

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local — fill in DATABASE_URL and NEXTAUTH_SECRET

# 4. Push schema to database
npm run db:push

# 5. Seed with sample data + test users
npm run db:seed

# 6. Start the dev server
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon connection string (with `?sslmode=require`) |
| `NEXTAUTH_SECRET` | Random 32-char string — generate with `openssl rand -hex 32` |
| `NEXTAUTH_URL` | App URL — `http://localhost:3000` locally, your Vercel URL in prod |

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@aasa.dev | Admin@123 |
| Seller | seller@aasa.dev | Seller@123 |

---

## Vercel Deployment

1. Push the repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set environment variables in Vercel project settings:
   - `DATABASE_URL` — your Neon connection string
   - `NEXTAUTH_SECRET` — a random 32-char secret
   - `NEXTAUTH_URL` — your Vercel deployment URL
4. Deploy — Vercel auto-detects Next.js
5. After first deployment, run the seed: `npm run db:seed`

---

## Features

### Admin Panel (`/admin`)
- Dashboard with summary stats, recent orders, low-stock alerts
- Products: paginated table, search/filter, add/edit/soft-delete, inline status toggle
- Categories: full CRUD with card grid layout
- Orders: all orders, status filter, detail with status progression (pending -> confirmed -> fulfilled)

### Seller Panel (`/dashboard`)
- Home: personalized welcome, quick stats
- Catalogue: card grid, debounced search, category pills, dual price display, add-to-cart
- Cart: real-time qty/unit editing, price breakdown, place order / save as draft
- My Orders: history with status badges, read-only detail view

---

## Project Structure

```
app/
  admin/          Admin panel pages
  dashboard/      Seller panel pages
  login/          Login page
  api/            Route handlers
    products/
    categories/
    orders/
    dashboard/stats/
components/
  ui/             shadcn/ui components
  app-sidebar.tsx Shared sidebar
  status-badge.tsx Order/product status badge
db/
  schema.ts       Drizzle schema (all 5 tables)
  migrations/     Generated SQL migrations
  seed.ts         Seed script
lib/
  db.ts           Neon + Drizzle connection
  units.ts        Unit conversion utilities
  format.ts       INR formatting, date, SKU helpers
  validations.ts  Zod schemas for all API routes
  cart-store.ts   Zustand cart store (persisted)
auth.ts           NextAuth v5 config
middleware.ts     Route protection
drizzle.config.ts drizzle-kit config
.env.example      Environment variable template
```
