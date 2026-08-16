# AstroKundli

Professional **Janam Kundli** web app built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**.  
Charts are calculated via the [Navamsha](https://www.navamsha.in) Swiss-Ephemeris API and cached in **IndexedDB**.

---

## Features

| Area | Details |
|------|---------|
| Birth chart (D1) | North-Indian diamond chart with degrees & planet colours |
| Divisional charts | D1–D60 (Shodashvarga) with per-varga tables |
| Vimshottari Dasha | Full Mahadasha timeline + current MD/AD |
| KP system | Star lord & sub lord |
| Location | Local city DB + Nominatim/Photon geocode proxy |
| Cache | **IndexedDB** primary, localStorage mirror |
| Fetch | **Parallel batch** (D1 + Dasha + KP + Vargas in one wave) |
| Export | Print + client-side PDF (html2canvas + jsPDF) |
| API key | Server-only via `NAVAMSHA_API_KEY` — never shipped to the browser |

---

## Quick start (local)

```bash
# 1. Install
npm install

# 2. Configure API key
cp .env.example .env.local
# Edit .env.local and set NAVAMSHA_API_KEY

# 3. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Get a free API key (no credit card):  
**https://www.navamsha.in/auth/signup** → dashboard → create key.

### Verify key

```bash
curl -s http://localhost:3000/api/health | jq
```

`ok: true` means the key works end-to-end.

Or open **Settings** in the app header.

---

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import the repo in [vercel.com](https://vercel.com).
3. Add environment variable:
   - Name: `NAVAMSHA_API_KEY`
   - Value: your Navamsha key
   - Environments: Production, Preview
4. Deploy.

CLI alternative:

```bash
npx vercel
npx vercel env add NAVAMSHA_API_KEY
npx vercel --prod
```

`vercel.json` is included (Mumbai region `bom1`, no-store on API routes).

---

## Environment variables

| Variable | Required | Where | Description |
|----------|----------|-------|-------------|
| `NAVAMSHA_API_KEY` | **Yes** | Server only | Navamsha REST API key |
| `NEXT_PUBLIC_APP_NAME` | No | Client | Display name |

**Never** prefix the API key with `NEXT_PUBLIC_` — that would expose it in the browser bundle.

---

## Architecture

```
Browser
  │  form / tabs / IndexedDB cache
  ▼
Next.js Route Handlers
  /api/navamsha/[...path]   → proxies to api.navamsha.in (adds X-API-Key)
  /api/geocode              → Nominatim + Photon + local city DB
  /api/health               → live key probe
  ▼
Navamsha API (Swiss Ephemeris)
```

### Caching strategy

1. First open of a kundli → parallel batch fetch → write full payload to **IndexedDB**.
2. Later opens → if D1 + Dasha + KP + Vargas present → **no network**.
3. localStorage keeps a mirror for older browsers / private mode edge cases.

### Parallel batch

```
generateKundali (D1)
        │
        ├── fetchVimshottariDasha + fetchCurrentDasha
        ├── fetchKpChart
        └── fetchShodashvarga  (or individual D2…D60)
```

---

## Scripts

```bash
npm run dev        # development
npm run build      # production build
npm run start      # serve production build
npm run lint       # ESLint
npm run typecheck  # TypeScript
```

---

## Project structure

```
src/
  app/
    page.tsx                 # Home — form + saved list
    settings/page.tsx        # API key status & docs
    kundli/[id]/page.tsx    # Detail tabs + charts
    api/navamsha/[...path]/ # Secure API proxy
    api/geocode/             # Place lookup
    api/health/              # Key probe
  components/
    NorthIndianChart.tsx     # Diamond NI chart
  lib/
    api.ts                   # Client → proxy helpers
    batch.ts                 # Parallel preload
    db.ts                    # IndexedDB
    storage.ts               # Facade
    locations.ts             # Offline city list
    types.ts
```

---

## License

MIT — UI code free to use. Navamsha API usage is subject to their terms.
