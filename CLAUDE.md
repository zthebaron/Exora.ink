# Exora.ink — Project Context

## What is this?
Exora.ink is a DTF (Direct-to-Film) Printing Intelligence Platform — profitability analysis, tiered pricing, and business intelligence tools for print operations. Deployed at [exora-ink.vercel.app](https://exora-ink.vercel.app). GitHub: `zthebaron/Exora.ink`. This is a **completely separate project** from Blue Line or any other SaaS — do not cross-reference.

## Tech Stack
- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Runtime:** React 19.2
- **Styling:** Tailwind CSS 4 + custom component system (no shadcn/ui, no Radix)
- **Database:** Neon (serverless PostgreSQL)
- **ORM:** Drizzle ORM 0.45 (+ drizzle-kit for migrations)
- **AI:** Anthropic Claude SDK 0.79 (chat widget)
- **Charts:** Recharts 3.8
- **Icons:** Lucide React
- **Theme:** next-themes (dark by default, light toggle)
- **Validation:** Zod 4
- **Deployment:** Vercel (auto-deploy from `main`)

## Project Structure
- `src/app/` — Next.js App Router pages and API routes
  - `admin/` — assumption config editor
  - `api/` — `/assumptions`, `/chat`, `/price-sheets`, `/scenarios`
  - `blog/` — DTF printing blog (list + `[slug]`)
  - `calculator/` — 4 tabs (see Pricing Model below)
  - `dashboard/` — executive KPI dashboard with Recharts
  - `equipment/` — printer + heat press spec pages
  - `infographics/` — visual assets
  - `price-sheets/` — printable customer price sheets
  - `scenarios/` — scenario analysis
  - `robots.ts`, `sitemap.ts` — SEO
- `src/components/`
  - `chat-widget.tsx` — global AI chat
  - `layout/` — header, footer
  - `theme-provider.tsx`, `theme-toggle.tsx`
  - `ui/` — custom primitives (card, slider, tabs, input, select, badge)
- `src/content/blog/` — blog post data (`posts.ts`, `new-posts.ts`)
- `src/db/` — Drizzle schema and client
- `src/hooks/` — `use-calculator`, `use-press-service`
- `src/lib/` — `constants`, `pricing-engine`, `formatters`, `utils`
- `src/types/` — central type definitions

## Conventions
- Use `@/` import alias for all imports
- Use `cn()` from `@/lib/utils` for conditional class merging
- **Brand colors:** teal primary `#0D9488`, sky secondary `#0EA5E9`, amber accent `#F59E0B`
- **Never use purple/violet** — user-level preference
- Dark theme by default
- Server components by default; `"use client"` only when needed
- All API routes validate input with Zod
- Prefer server actions for form mutations where appropriate
- **Tabs component** (`src/components/ui/tabs.tsx`) is a custom React Context implementation — NOT Radix. API: `<Tabs defaultValue>`, `<TabsList>`, `<TabsTrigger value>`, `<TabsContent value>`
- Dev server runs on port `3002` (see `.claude/launch.json`)

## Key Pricing Files
These are the files touched most when iterating on pricing logic:

- **`src/lib/constants.ts`** — roll width options, gang sheet sizes, volume discount tiers, screen print rates (ScreenPlay benchmark), color-tier discount matrix, placement types, press locations, individual transfer sizes/tiers
- **`src/lib/pricing-engine.ts`** — cost breakdown, retail/wholesale/rush pricing, scenario presets, sensitivity analysis, CLV, tiered press service quoting (`calculatePressServiceQuote`), width advantage comparison
- **`src/types/index.ts`** — `Assumptions`, `CostBreakdown`, `PricingResult`, `ScenarioResult`, `PressServiceQuoteInput/Result`, `WidthComparisonResult`, `ColorTierDiscount`
- **`src/app/calculator/`** — 4 tab components:
  - `individual-transfers-calculator.tsx` — per-transfer pricing by sq in
  - `gang-sheet-calculator.tsx` — full profitability calc with sliders
  - `press-only-calculator.tsx` — tiered print-and-press quoting tool (v3 model)
  - `full-service-calculator.tsx` — garment + print + press

## Pricing Model (v3)

### Hardware
- **Printer:** Mimaki TxF300-75
- **Printable width:** 30" (on 31" film)
- **Roll:** 325 ft, $264.49 (Millcraft MSI00305713)
- **Ink:** White $0.16/mL ($80/500mL), Color $0.133/mL ($80/600mL)

### Calculator Tab Order
**Individual Transfers → Gang Sheets → Press Service → Full Service** (Individual Transfers is the lead product, default tab)

### Press Service Tiered Pricing
Anchored to ScreenPlay screen print rates (`$1.56/shirt/location` at 1 color, 49–143 qty), with discount scaling by color count:

| Tier | 1 color | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|------|---------|---|---|---|---|---|---|---|
| A — Premium | 5% | 15% | 20% | 25% | 28% | 30% | 31% | 32% |
| B — Competitive (default) | 10% | 25% | 32% | 38% | 42% | 45% | 47% | 48% |
| C — Volume/Acquisition | 15% | 35% | 42% | 48% | 52% | 55% | 57% | 58% |

- **Tier A** — complex designs, premium garments, precision placements
- **Tier B** — default for most jobs, balanced savings/margin
- **Tier C** — win competitive bids, high-volume, price-sensitive

### Placement Complexity Multipliers
- **Standard** (1.0×) — center chest, full back, left chest, sleeves
- **Precision** (1.25×) — near existing branding, exact measurements
- **Specialty** (1.50×) — seams, collar, pocket

### Guardrails
- **50% gross margin floor** — below this triggers a red warning in the internal margin view
- Internal metrics (cost/shirt, GM%) hidden behind a toggle so they don't show customer-facing

### Individual Transfer Base Rate
`$0.06/sq in` with volume breaks (up to 25% off at 250+)

### Competitive Reference
- 22" competitor width (Ninja Transfers, etc.) — internal-only comparison overlay
- Our 30" width = 360 sq in/ft vs competitor 264 sq in/ft (36% more area)

## Brand Voice
Professional, data-driven, operator-focused. Clear and direct. Numbers backed by sources when possible. No fluff, no jargon. The audience is print shop operators making real business decisions — respect their time.
