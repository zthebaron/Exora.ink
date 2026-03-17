# Exora.ink — DTF Printing Intelligence Platform

Professional DTF profitability analysis, pricing optimization, and business intelligence for modern print operations.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Styling:** Tailwind CSS 4 + custom component system
- **Database:** Neon (serverless PostgreSQL)
- **ORM:** Drizzle ORM
- **Charts:** Recharts
- **Icons:** Lucide React
- **Theme:** next-themes (light/dark mode)
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Neon](https://neon.tech) database (free tier works)

### Installation

```bash
git clone <repo-url>
cd Exora.ink
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Neon database URL:

```
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/exora?sslmode=require
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Generate and run migrations:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Seed sample data:

```bash
npx tsx src/db/seed.ts
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables:
   - `DATABASE_URL` — your Neon connection string
   - `NEXT_PUBLIC_APP_URL` — your production URL
4. Deploy

## Pages & Features

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with feature overview and CTAs |
| Calculator | `/calculator` | Full profitability calculator with live inputs, cost breakdown, pricing, CLV |
| Scenarios | `/scenarios` | 10 preset scenarios, custom scenario builder, sensitivity analysis |
| Dashboard | `/dashboard` | 8 executive charts with interactive controls (volume, price, waste, mix) |
| Price Sheets | `/price-sheets` | Customer-facing price sheet generator (retail/wholesale/reseller) with print |
| Infographics | `/infographics` | Internal team guide and customer-facing visual guide |
| Admin | `/admin` | Manage assumptions, products, pricing tiers, company settings, content |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/assumptions` | GET/POST | Get or save business assumptions |
| `/api/scenarios` | GET/POST | Get scenario presets or save custom scenarios |
| `/api/price-sheets` | GET | Get calculated pricing for all sizes |

## Database Schema

- `users` — user accounts
- `saved_assumptions` — saved business assumption sets
- `pricing_models` — retail/wholesale/reseller pricing configs
- `product_sizes` — gang sheet sizes with pricing
- `scenarios` / `scenario_results` — saved scenarios and results
- `customer_price_sheets` — saved price sheet configurations
- `infographic_configs` — infographic content settings
- `exports` — export history
- `company_settings` — key/value company configuration

## Pricing Engine

The core pricing engine (`src/lib/pricing-engine.ts`) provides:

- **Cost Breakdown:** Film, ink, powder, labor, equipment burden, overhead, waste, packaging, reprint reserve
- **Pricing Calculation:** Retail, wholesale, and rush pricing from desired margins
- **Scenario Analysis:** 10 presets covering volume, pricing strategy, and customer mix variations
- **Sensitivity Analysis:** 8-variable impact testing (price, waste, ink, labor, volume, order size, discounts, overhead)
- **Customer Lifetime Value:** 3-year CLV with payback period calculation

### Key Formulas

- `Cost per sq ft = (material + ink + powder + labor + equipment + overhead) / area`
- `Retail Price = Total Cost / (1 - Desired Gross Margin%)`
- `Wholesale Price = Retail Price x 0.70`
- `Rush Price = Retail Price x (1 + Rush Fee%)`
- `Gross Margin = (Revenue - COGS) / Revenue x 100`
- `Break-even Orders = Fixed Costs / (Price - Variable Cost)`
- `CLV = (Avg Order x Frequency x Years) - Acquisition Cost`

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home
│   ├── calculator/page.tsx   # Profitability Calculator
│   ├── scenarios/page.tsx    # Scenario Analysis
│   ├── dashboard/page.tsx    # Executive Dashboard
│   ├── price-sheets/page.tsx # Price Sheet Generator
│   ├── infographics/page.tsx # Infographics & Guides
│   ├── admin/page.tsx        # Admin & Settings
│   └── api/                  # API routes
├── components/
│   ├── ui/                   # Card, Input, Select, Slider, Tabs, Badge
│   ├── layout/               # Header, Footer
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── lib/
│   ├── pricing-engine.ts     # Core financial logic
│   ├── formatters.ts         # Currency, percent, number formatting
│   ├── constants.ts          # Brand, sizes, discount tiers
│   └── utils.ts              # cn() utility
├── db/
│   ├── schema.ts             # Drizzle schema (10 tables)
│   ├── index.ts              # Database client
│   └── seed.ts               # Sample data seeder
├── hooks/
│   └── use-calculator.ts     # Calculator state management
└── types/
    └── index.ts              # TypeScript interfaces
```

## Pricing Recommendation

The most profitable pricing model for DTF operations is a **balanced retail/wholesale mix (60/40)** with:
- 55% gross margin on retail orders
- 30% wholesale discount (wholesale at 70% of retail)
- 50% rush order surcharge
- Volume discounts from 5-25% to incentivize larger orders

## 90-Day Margin Improvement Plan

1. **Reduce waste** from 5% to 3% by improving gang sheet nesting and artwork optimization
2. **Launch rush pricing** to capture 50% premiums on urgent orders (target 15-20% of orders)
3. **Build wholesale program** targeting 30% of revenue from B2B accounts
4. **Implement volume tiers** to drive larger average order sizes
5. **Track CLV** and build repeat customer programs (email, loyalty pricing)
6. **Review overhead monthly** and renegotiate supplier contracts quarterly

---

Created by Tim de Vallee, AI Architect, 310-453-5555 tim@digitalboutique.ai
Digital Boutique a Division of Digital Universe
