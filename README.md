# Tourist Place Search & Ranking System — Engine 2 (Logic & Rule)

**KLE Technological University, Hubballi — Department of BCA — Team 02**

| Field | Detail |
|---|---|
| Theme | Tourist Place Search and Ranking System |
| Engine | **Engine 2 — Logic & Rule (Data Structures & Programming)** |
| Student | Vivek B M · USN: 01FE24BCA266 |
| Faculty Guides | Prof. Pavankumar Vadavi · Prof. Sayeeda Anjum |
| Repository | https://github.com/Gourikori/miniproject2 |

---

## Engine Responsibilities (All 3 Engines)

| Engine | Owner | Role |
|---|---|---|
| Engine 1 | Shrilakshmi | Data & Integrity — MySQL schema, SQL, `tourist_db1` |
| **Engine 2** | **Vivek B M** | **Logic & Rule — Ranking algorithm, REST API server** |
| Engine 3 | Gouri K | Web UI — HTML/CSS/JS frontend at `localhost:5500` |

---

## Core Deliverables

### 1. Hand-Built Data Structure: `CustomMaxHeap`
A Binary Max-Heap implemented from scratch in [`ranking_core.js`](./ranking_core.js):
- **Floyd's buildHeap** — O(N) linear construction
- **extractMax** — O(log N) per extraction
- **getTopK(k)** — O(N + K log N) total (vs O(N log N) for full sort)
- Deterministic tie-breaking: Score → Rating → Popularity → Lexicographic Name

### 2. Main Calculation: Composite Scoring Formula
```
Score = (w1 × Rating_norm) + (w2 × Popularity_norm) + (w3 × PreferenceMatch) + (w4 × Proximity_norm)
```
- All components normalized to [0, 1]
- **Score ∈ [0.0000, 1.0000]** — bounded, never exceeds range
- Weights validated: must be non-negative and sum to exactly 1.000 ± 0.005
- Default weights: `wRating=0.40, wPopularity=0.30, wPreference=0.20, wDistance=0.10`

### 3. REST API Server — [`server.js`](./server.js)
Running on **http://localhost:5000**, CORS-enabled for Engine 3 (`localhost:5500`).

---

## Quick Start

### Step 1 — Install (optional for MySQL support)
```powershell
cd C:\path\to\Tourist_place_search_and_ranking_system
npm install
```
> **Note:** `npm install` is only needed for MySQL database integration.  
> The server starts and serves all 34 Karnataka places **without MySQL** using the built-in fallback dataset.

### Step 2 — Configure Database (optional)
Copy `.env.example` to `.env` and fill in your Engine 1 MySQL credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tourist_db1
```

### Step 3 — Start the Server
```powershell
node server.js
```
Expected output:
```
════════════════════════════════════════════════════════════
  ENGINE 2 — LOGIC & RULE   |   Tourist Place Search & Ranking
  KLE Technological University, Hubballi — BCA Dept — Team 02
  Student : Vivek B M (01FE24BCA266)
  Server  : http://localhost:5000
  Dataset : 34 places (source: hardcoded-fallback)
  DB      : ✗ Fallback (MySQL offline)
  CORS    : enabled for all origins (Engine 3 @ localhost:5500 ✓)
════════════════════════════════════════════════════════════
```

### Step 4 — Run Tests
> Server must be running in another terminal first.
```powershell
node test_engine2.js
```
Expected: **67/67 tests PASSED**

---

## API Endpoints

### `GET /api/health`
Engine status, DB info, algorithm metadata.

```json
{ "status": "ONLINE", "engine": "Engine 2: Logic & Rule", "dataset_size": 34, "cors_origin": "*", ... }
```

### `GET /api/categories`
```json
{ "categories": [ { "category_id": 1, "category_name": "Beach" }, ... ] }
```

### `GET /api/places?active=true`
```json
{ "count": 34, "places": [ { "place_id": 1, "place_name": "...", "rating": 4.3, "entry_fee": 10, ... } ] }
```

### `GET /api/places/autocomplete?q=hampi`
```json
{ "suggestions": [ { "place_id": 16, "place_name": "Virupaksha Temple & Hampi Ruins", "city": "Hampi", "category_name": "Historical" } ] }
```

### `POST /api/rank`
**Request body:**
```json
{
  "keyword": "beach",
  "category_id": 1,
  "max_budget": 100,
  "max_distance": 300,
  "min_rating": 4.0,
  "top_k": 5,
  "sort_by": "score",
  "weights": { "wRating": 0.40, "wPopularity": 0.30, "wPreference": 0.20, "wDistance": 0.10 }
}
```

| Parameter | Type | Description |
|---|---|---|
| `keyword` | string | Search term — matches name, city, category, description |
| `category_id` | int | Preferred category ID (boost, not filter). 0 = no preference |
| `max_budget` | number | `-1` = no limit · `0` = free only · `>0` = max entry fee |
| `max_distance` | number | `-1` = no limit · `>0` = km radius from Hubballi |
| `min_rating` | number | Minimum rating threshold (0.0 – 5.0) |
| `top_k` | int | Number of results to return (default 10) |
| `sort_by` | string | `score` (default), `rating`, `distance`, `fee`, `popularity` |
| `weights` | object | Optional custom weights (must sum to 1.000) |

**Response:**
```json
{
  "metadata": {
    "algorithm": "CustomMaxHeap (Hand-built Priority Queue)",
    "candidate_pool_size": 7,
    "top_k_requested": 5,
    "returned_count": 5,
    "execution_time_ms": 0.123,
    "weights_applied": { "wRating": 0.40, "wPopularity": 0.30, "wPreference": 0.20, "wDistance": 0.10 }
  },
  "results": [
    {
      "place_id": 5, "place_name": "Gokarna Om Beach", "city": "Gokarna",
      "category_name": "Beach", "entry_fee": 0, "distance_km": 150,
      "rating": 4.6, "popularity": 92,
      "composite_score": 0.7560,
      "breakdown": {
        "raw_rating": 4.6,       "norm_rating": 0.92,  "weighted_rating": 0.368,
        "raw_popularity": 92,    "norm_popularity": 0.92, "weighted_popularity": 0.276,
        "preference_match": 1.0, "weighted_preference": 0.20,
        "raw_distance_km": 150,  "norm_proximity": 0.70, "weighted_proximity": 0.07,
        "formula": "(0.40 * 0.92) + (0.30 * 0.92) + (0.20 * 1) + (0.10 * 0.70)"
      }
    }
  ]
}
```

### `GET /api/audit-logs`
Returns Engine 1 audit trail (from MySQL if connected, or static sample).

### `GET /api/benchmark?n=2000&k=10`
Benchmarks CustomMaxHeap vs Array.sort for algorithm justification.

---

## Error Responses

| HTTP | Trigger | Example |
|---|---|---|
| 400 | Invalid weights, bad budget/rating, malformed JSON | `{ "error": "RULE VIOLATION (B2): weights must sum to 1.000" }` |
| 404 | Unknown route | `{ "error": "Route not found: GET /api/xyz", "available_routes": [...] }` |
| 500 | Internal server or ranking error | `{ "error": "Internal server error.", "detail": "..." }` |

---

## Files

| File | Purpose |
|---|---|
| `server.js` | Main HTTP REST API server (port 5000) |
| `ranking_core.js` | Canonical ranking algorithm + CustomMaxHeap + validation |
| `backend_db_connection.js` | MySQL2 integration for Engine 1 `tourist_db1` |
| `test_engine2.js` | 67 integration tests against live API |
| `package.json` | Dependencies: `mysql2`, `dotenv` |
| `.env.example` | Template for database credentials |
| `.gitignore` | Excludes `.env` and `node_modules` |
| `engine2_ranking.cpp` | Standalone C++ DSA demo (not the runtime server) |
| `engine2_backend.py` | Standalone Python demo (not the runtime server) |
| `GATE_00_EVIDENCE_ENGINE2.md` | Gate 0 submission evidence |
| `GATE_01_EVIDENCE_ENGINE2.md` | Gate 1 submission evidence |

---

## Engine 3 Integration

Engine 3 (Gouri K's Web UI at `localhost:5500`) connects to Engine 2 at `http://localhost:5000`.

**CORS:** All routes include `Access-Control-Allow-Origin: *` — no CORS errors.

**To connect:**
1. Start Engine 2: `node server.js` (from this folder)
2. Open Engine 3 HTML at `localhost:5500` (or via VS Code Live Server)
3. Engine 3 auto-fetches `/api/categories` and `/api/places` on load
4. Search calls `POST /api/rank` — results include `composite_score` in [0,1]

---

## Test Results

```
[ SUITE A ] Basic Connectivity        — 4/4  ✓
[ SUITE B ] Categories                — 5/5  ✓
[ SUITE C ] Places Listing            — 10/10 ✓
[ SUITE D ] Autocomplete              — 5/5  ✓
[ SUITE E ] POST /api/rank Ranking    — 10/10 ✓
[ SUITE F ] Budget Filters            — 5/5  ✓
[ SUITE G ] Rating Filter             — 2/2  ✓
[ SUITE H ] Sort Modes                — 8/8  ✓
[ SUITE I ] Keyword Search            — 4/4  ✓
[ SUITE J ] Category Preference Boost — 3/3  ✓
[ SUITE K ] Validation Errors         — 6/6  ✓
[ SUITE L ] Dataset Completeness      — 3/3  ✓
[ SUITE M ] 404 Handling              — 2/2  ✓

TOTAL: 67/67 PASSED
```
