/**
 * ====================================================================================================
 * KLE TECHNOLOGICAL UNIVERSITY, HUBBALLI
 * DEPARTMENT OF BACHELOR OF COMPUTER APPLICATIONS
 * THEME 2: TOURIST PLACE SEARCH AND RANKING SYSTEM
 *
 * ENGINE 2: LOGIC & RULE (DATA STRUCTURES & PROGRAMMING)
 * Student : Vivek B M (USN: 01FE24BCA266)
 * Guides  : Prof. Pavankumar Vadavi, Prof. Sayeeda Anjum
 *
 * REST API Server  — http://localhost:5000
 * Compatible with  : Engine 3 (Gouri K, localhost:5500)
 * Database         : Engine 1 (Shrilakshmi) → tourist_db1 (MySQL, with graceful fallback)
 *
 * Core Deliverables:
 *   1. Hand-built Binary Max-Heap (CustomMaxHeap) — no Array.sort for ranking.
 *   2. Multi-factor composite scoring formula   — Score ∈ [0.0, 1.0].
 *   3. REST endpoints consumed by Engine 3 Web UI.
 * ====================================================================================================
 */

'use strict';

// ── Load environment variables FIRST (before any other require) ─────────────
try { require('dotenv').config(); } catch (_) { /* dotenv optional */ }

const http  = require('http');
const url   = require('url');

// ── Import canonical ranking engine (Engine 2 core algorithm) ───────────────
const { executeSearchAndRank, validateWeights, CustomMaxHeap } = require('./ranking_core');

// ── Attempt to import MySQL connector (optional — falls back to hardcoded data)
let db = null;
try { db = require('./backend_db_connection'); } catch (_) { /* no-op */ }

const PORT = parseInt(process.env.PORT || '5000', 10);

// ============================================================================
// SECTION 1: MASTER FALLBACK DATASET (34 KARNATAKA DESTINATIONS)
//   Used when MySQL (Engine 1) is unavailable. Kept in sync with Engine 1 SQL.
// ============================================================================
const FALLBACK_CATEGORIES = [
    { category_id: 1, category_name: 'Beach'       },
    { category_id: 2, category_name: 'Historical'   },
    { category_id: 3, category_name: 'Nature'       },
    { category_id: 4, category_name: 'Temple'       },
    { category_id: 5, category_name: 'Wildlife'     },
    { category_id: 6, category_name: 'Hill Station' }
];

const FALLBACK_PLACES = [
    // ── Hubballi – Dharwad ──────────────────────────────────────────────────
    { place_id:  1, place_name: 'Unkal Lake & Park',              city: 'Hubballi',    state: 'Karnataka', category_id: 3, category_name: 'Nature',      entry_fee:   10, distance_km:   6.0, rating: 4.30, popularity:  82, best_time_to_visit: 'July to October',     description: 'A calm lakeside escape for an evening walk and family outing.',              status: 'ACTIVE' },
    { place_id:  2, place_name: 'Chandramouleshwara Temple',      city: 'Hubballi',    state: 'Karnataka', category_id: 4, category_name: 'Temple',      entry_fee:    0, distance_km:   8.5, rating: 4.50, popularity:  78, best_time_to_visit: 'October to March',    description: 'Historic stone carvings and Western Chalukyan architecture.',                status: 'ACTIVE' },
    { place_id:  3, place_name: 'Nrupatunga Betta Viewpoint',     city: 'Hubballi',    state: 'Karnataka', category_id: 3, category_name: 'Nature',      entry_fee:   20, distance_km:  10.0, rating: 4.40, popularity:  80, best_time_to_visit: 'July to October',     description: 'Scenic hillock offering panoramic city viewpoints.',                         status: 'ACTIVE' },
    { place_id:  4, place_name: 'Sadhankeri Park & Lake',         city: 'Dharwad',     state: 'Karnataka', category_id: 3, category_name: 'Nature',      entry_fee:   10, distance_km:  22.0, rating: 4.20, popularity:  72, best_time_to_visit: 'October to March',    description: 'Serene garden memorial commemorating poet Da. Ra. Bendre.',                  status: 'ACTIVE' },
    // ── Coastal & Western Ghats ─────────────────────────────────────────────
    { place_id:  5, place_name: 'Gokarna Om Beach',               city: 'Gokarna',     state: 'Karnataka', category_id: 1, category_name: 'Beach',       entry_fee:    0, distance_km: 150.0, rating: 4.60, popularity:  92, best_time_to_visit: 'November to February', description: 'Sweeping coastline and laid-back beach town atmosphere.',                    status: 'ACTIVE' },
    { place_id:  6, place_name: 'Kudle Beach',                    city: 'Gokarna',     state: 'Karnataka', category_id: 1, category_name: 'Beach',       entry_fee:    0, distance_km: 152.0, rating: 4.50, popularity:  88, best_time_to_visit: 'November to February', description: 'Scenic coastal stretch ideal for swimming and sunsets.',                      status: 'ACTIVE' },
    { place_id:  7, place_name: 'Murudeshwar Temple & Beach',     city: 'Murudeshwar', state: 'Karnataka', category_id: 4, category_name: 'Temple',      entry_fee:    0, distance_km: 185.0, rating: 4.70, popularity:  95, best_time_to_visit: 'October to March',    description: 'Dramatic landmark with giant Shiva statue and Arabian Sea views.',           status: 'ACTIVE' },
    { place_id:  8, place_name: 'Yana Rocks & Caves',             city: 'Kumta',       state: 'Karnataka', category_id: 3, category_name: 'Nature',      entry_fee:   20, distance_km: 140.0, rating: 4.60, popularity:  85, best_time_to_visit: 'October to March',    description: 'Gigantic limestone karst formations inside thick rainforest.',               status: 'ACTIVE' },
    { place_id:  9, place_name: 'Sathodi Falls',                  city: 'Yellapur',    state: 'Karnataka', category_id: 3, category_name: 'Nature',      entry_fee:   30, distance_km:  75.0, rating: 4.50, popularity:  81, best_time_to_visit: 'July to October',     description: 'Picturesque rectangular forest waterfall.',                                  status: 'ACTIVE' },
    { place_id: 10, place_name: 'Magod Falls',                    city: 'Yellapur',    state: 'Karnataka', category_id: 3, category_name: 'Nature',      entry_fee:   20, distance_km:  80.0, rating: 4.30, popularity:  76, best_time_to_visit: 'July to October',     description: 'Bedthi river tumbling down two tiers in deep valleys.',                     status: 'ACTIVE' },
    { place_id: 11, place_name: 'Sirsi Marikamba Temple',         city: 'Sirsi',       state: 'Karnataka', category_id: 4, category_name: 'Temple',      entry_fee:    0, distance_km: 102.0, rating: 4.80, popularity:  89, best_time_to_visit: 'October to March',    description: 'Renowned 16th-century temple adorned with wooden carvings.',                status: 'ACTIVE' },
    { place_id: 12, place_name: 'Dandeli River Rafting & Wildlife', city: 'Dandeli',   state: 'Karnataka', category_id: 5, category_name: 'Wildlife',    entry_fee:  250, distance_km:  74.0, rating: 4.60, popularity:  94, best_time_to_visit: 'October to March',    description: 'River scenery, forest trails, and white-water rafting on Kali river.',      status: 'ACTIVE' },
    { place_id: 13, place_name: 'Ulavi Channabasaveshwara Temple', city: 'Ulavi',      state: 'Karnataka', category_id: 4, category_name: 'Temple',      entry_fee:    0, distance_km:  95.0, rating: 4.40, popularity:  79, best_time_to_visit: 'October to March',    description: 'Important Lingayat pilgrimage shrine surrounded by dense forests.',          status: 'ACTIVE' },
    { place_id: 14, place_name: 'Banavasi Madhukeshwara Temple',  city: 'Banavasi',    state: 'Karnataka', category_id: 2, category_name: 'Historical',  entry_fee:    0, distance_km: 125.0, rating: 4.60, popularity:  83, best_time_to_visit: 'October to March',    description: 'Ancient Chalukya-Kadamba architectural gem and first Kannada capital.',      status: 'ACTIVE' },
    { place_id: 15, place_name: 'Malpe Beach & St Mary Island',   city: 'Udupi',       state: 'Karnataka', category_id: 1, category_name: 'Beach',       entry_fee:  300, distance_km: 250.0, rating: 4.60, popularity:  91, best_time_to_visit: 'November to February', description: 'Pristine coastline and volcanic columnar basalt rock islands.',               status: 'ACTIVE' },
    // ── North Karnataka Heritage ────────────────────────────────────────────
    { place_id: 16, place_name: 'Virupaksha Temple & Hampi Ruins', city: 'Hampi',      state: 'Karnataka', category_id: 2, category_name: 'Historical',  entry_fee:   50, distance_km: 165.0, rating: 4.90, popularity:  98, best_time_to_visit: 'October to March',    description: 'Extraordinary UNESCO landscape of temples and boulder ruins.',               status: 'ACTIVE' },
    { place_id: 17, place_name: 'Vijaya Vittala Temple & Stone Chariot', city: 'Hampi', state: 'Karnataka', category_id: 2, category_name: 'Historical', entry_fee:   50, distance_km: 168.0, rating: 4.90, popularity:  99, best_time_to_visit: 'October to March',    description: 'Iconic carved stone chariot and musical pillars.',                           status: 'ACTIVE' },
    { place_id: 18, place_name: 'Badami Cave Temples',             city: 'Badami',      state: 'Karnataka', category_id: 2, category_name: 'Historical',  entry_fee:   30, distance_km: 105.0, rating: 4.70, popularity:  91, best_time_to_visit: 'October to March',    description: 'Rock-cut cave shrines overlooking red sandstone cliffs and Agastya Lake.',   status: 'ACTIVE' },
    { place_id: 19, place_name: 'Pattadakal UNESCO Monuments',     city: 'Pattadakal',  state: 'Karnataka', category_id: 2, category_name: 'Historical',  entry_fee:   40, distance_km: 128.0, rating: 4.80, popularity:  90, best_time_to_visit: 'October to March',    description: '7th-8th century architectural synthesis of Rekha-Nagara and Dravidian styles.', status: 'ACTIVE' },
    { place_id: 20, place_name: 'Aihole Historical Complex',       city: 'Aihole',      state: 'Karnataka', category_id: 2, category_name: 'Historical',  entry_fee:   30, distance_km: 135.0, rating: 4.50, popularity:  84, best_time_to_visit: 'October to March',    description: 'Cradle of Hindu structural temple architecture with over 120 monuments.',    status: 'ACTIVE' },
    { place_id: 21, place_name: 'Gol Gumbaz',                      city: 'Vijayapura',  state: 'Karnataka', category_id: 2, category_name: 'Historical',  entry_fee:   25, distance_km: 200.0, rating: 4.60, popularity:  87, best_time_to_visit: 'October to March',    description: 'Massive circular dome mausoleum with acoustical Whispering Gallery.',        status: 'ACTIVE' },
    { place_id: 22, place_name: 'Chitradurga Fort',                city: 'Chitradurga', state: 'Karnataka', category_id: 2, category_name: 'Historical',  entry_fee:   25, distance_km: 205.0, rating: 4.70, popularity:  89, best_time_to_visit: 'October to March',    description: 'Impenetrable medieval stone fortress featuring 7 concentric ramparts.',     status: 'ACTIVE' },
    // ── Malnad & Hill Stations ───────────────────────────────────────────────
    { place_id: 23, place_name: 'Jog Falls Viewpoint',             city: 'Shivamogga',      state: 'Karnataka', category_id: 3, category_name: 'Nature',      entry_fee:   50, distance_km: 160.0, rating: 4.70, popularity:  93, best_time_to_visit: 'July to October',     description: 'Dramatic plunge waterfall framed by Western Ghats gorges.',                 status: 'ACTIVE' },
    { place_id: 24, place_name: 'Agumbe Sunset Point',             city: 'Shivamogga',      state: 'Karnataka', category_id: 6, category_name: 'Hill Station', entry_fee:    0, distance_km: 240.0, rating: 4.50, popularity:  85, best_time_to_visit: 'October to March',    description: 'High Ghats viewpoint famous for sunset panoramas over Arabian Sea.',        status: 'ACTIVE' },
    { place_id: 25, place_name: 'Mullayanagiri Peak',               city: 'Chikkamagaluru', state: 'Karnataka', category_id: 6, category_name: 'Hill Station', entry_fee:    0, distance_km: 275.0, rating: 4.80, popularity:  96, best_time_to_visit: 'October to March',    description: 'Highest mountain peak in Karnataka with cool mist and panoramic trails.',   status: 'ACTIVE' },
    { place_id: 26, place_name: 'Baba Budangiri Shrine & Hills',   city: 'Chikkamagaluru', state: 'Karnataka', category_id: 6, category_name: 'Hill Station', entry_fee:    0, distance_km: 285.0, rating: 4.40, popularity:  86, best_time_to_visit: 'October to March',    description: 'Misty mountain range with Sufi shrine and rolling coffee plantations.',      status: 'ACTIVE' },
    { place_id: 27, place_name: 'Kudremukh National Park',         city: 'Chikkamagaluru', state: 'Karnataka', category_id: 5, category_name: 'Wildlife',    entry_fee:  200, distance_km: 310.0, rating: 4.70, popularity:  88, best_time_to_visit: 'October to March',    description: 'Horse-faced peak with montane shola grasslands and rich fauna.',            status: 'ACTIVE' },
    { place_id: 28, place_name: 'Belur Chennakeshava Temple',      city: 'Belur',           state: 'Karnataka', category_id: 2, category_name: 'Historical',  entry_fee:    0, distance_km: 290.0, rating: 4.80, popularity:  92, best_time_to_visit: 'October to March',    description: 'Soapstone architectural marvel depicting celestial dancers.',               status: 'ACTIVE' },
    { place_id: 29, place_name: 'Halebidu Hoysaleshwara Temple',   city: 'Halebidu',        state: 'Karnataka', category_id: 2, category_name: 'Historical',  entry_fee:    0, distance_km: 300.0, rating: 4.80, popularity:  91, best_time_to_visit: 'October to March',    description: '12th-century twin-temple adorned with intricate relief sculptures.',        status: 'ACTIVE' },
    // ── South Karnataka ─────────────────────────────────────────────────────
    { place_id: 30, place_name: 'Mysore Palace',                   city: 'Mysuru',  state: 'Karnataka', category_id: 2, category_name: 'Historical',  entry_fee:  100, distance_km: 410.0, rating: 4.90, popularity:  98, best_time_to_visit: 'October to March',    description: 'Grand royal palace with Indo-Saracenic halls and 100,000 festival lights.', status: 'ACTIVE' },
    { place_id: 31, place_name: 'Chamundi Hill & Temple',          city: 'Mysuru',  state: 'Karnataka', category_id: 4, category_name: 'Temple',      entry_fee:    0, distance_km: 415.0, rating: 4.70, popularity:  90, best_time_to_visit: 'October to March',    description: 'Dravidian gopuram shrine overlooking Mysuru city with monolithic Nandi.',   status: 'ACTIVE' },
    { place_id: 32, place_name: 'Abbey Falls',                     city: 'Madikeri', state: 'Karnataka', category_id: 3, category_name: 'Nature',     entry_fee:   50, distance_km: 380.0, rating: 4.50, popularity:  87, best_time_to_visit: 'July to October',     description: 'Roaring waterfall nestled inside lush spice and coffee plantations.',       status: 'ACTIVE' },
    { place_id: 33, place_name: 'Raja Seat Viewpoint',             city: 'Madikeri', state: 'Karnataka', category_id: 6, category_name: 'Hill Station', entry_fee:  25, distance_km: 375.0, rating: 4.40, popularity:  84, best_time_to_visit: 'October to March',    description: 'Seasonal garden where Kodagu kings observed dramatic sunsets.',             status: 'ACTIVE' },
    { place_id: 34, place_name: 'Bandipur National Park Safari',   city: 'Bandipur', state: 'Karnataka', category_id: 5, category_name: 'Wildlife',    entry_fee:  350, distance_km: 480.0, rating: 4.70, popularity:  94, best_time_to_visit: 'October to March',    description: 'Renowned Tiger Reserve home to elephants, gaurs, and Bengal tigers.',      status: 'ACTIVE' }
];

// ============================================================================
// SECTION 2: RUNTIME STATE (populated at startup, refreshed from MySQL if live)
// ============================================================================
let catalog    = FALLBACK_PLACES.slice();      // active places
let categories = FALLBACK_CATEGORIES.slice();  // category list
let dbStatus   = { connected: false, source: 'hardcoded-fallback', message: 'MySQL not attempted yet.' };

// ── Startup: attempt to load from MySQL Engine 1 database ───────────────────
async function initDatabase() {
    if (!db) {
        dbStatus = { connected: false, source: 'hardcoded-fallback', message: 'mysql2 not installed — running npm install is required for MySQL.' };
        console.log('[Engine 2] mysql2 not available → using 34-place Karnataka fallback dataset.');
        return;
    }
    try {
        const connResult = await db.testConnection();
        if (!connResult.connected) {
            dbStatus = { connected: false, source: 'hardcoded-fallback', message: connResult.error || 'MySQL unreachable.' };
            console.log(`[Engine 2] MySQL offline (${connResult.error}) → 34-place Karnataka fallback active.`);
            return;
        }
        // MySQL is live — load from Engine 1
        const [dbPlaces, dbCategories] = await Promise.all([db.loadPlaces(true), db.loadCategories()]);
        if (dbPlaces.length > 0) {
            catalog = dbPlaces;
            console.log(`[Engine 2] Loaded ${catalog.length} active places from MySQL (tourist_db1).`);
        }
        if (dbCategories.length > 0) {
            categories = dbCategories;
        }
        dbStatus = { connected: true, source: 'mysql-tourist_db1', host: connResult.host, database: connResult.database, message: `${catalog.length} places loaded.` };
    } catch (err) {
        dbStatus = { connected: false, source: 'hardcoded-fallback', message: err.message };
        console.log(`[Engine 2] DB init error: ${err.message} → fallback active.`);
    }
}

// ============================================================================
// SECTION 3: HTTP UTILITY HELPERS
// ============================================================================
const CORS_HEADERS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key'
};

function sendJSON(res, statusCode, data) {
    const body = JSON.stringify(data, null, 2);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        ...CORS_HEADERS
    });
    res.end(body);
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', chunk => { raw += chunk.toString(); if (raw.length > 1e6) req.destroy(); });
        req.on('end',  () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(new Error('Malformed JSON payload.')); } });
        req.on('error', reject);
    });
}

// ============================================================================
// SECTION 4: ROUTE HANDLERS
// ============================================================================

/** GET / — Engine 2 info page (HTML) */
function handleRoot(res) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Engine 2 — Tourist Place Search & Ranking</title>
<style>
  body{font-family:system-ui,sans-serif;background:#0f172a;color:#f8fafc;margin:0;padding:24px}
  .box{max-width:960px;margin:auto;background:#1e293b;border-radius:12px;padding:28px;box-shadow:0 8px 24px rgba(0,0,0,.5)}
  h1{color:#38bdf8;margin-top:0}code{background:#0f172a;padding:2px 6px;border-radius:4px;color:#a5f3fc}
  table{width:100%;border-collapse:collapse;margin:12px 0}th,td{padding:9px 12px;border-bottom:1px solid #334155;text-align:left}
  th{background:#0ea5e9;color:#fff}.badge{background:#0284c7;color:#fff;padding:3px 9px;border-radius:5px;font-size:12px}
</style>
</head>
<body><div class="box">
<h1>Tourist Place Search &amp; Ranking <span class="badge">Engine 2 — Logic &amp; Rule</span></h1>
<p><strong>KLE Technological University, Hubballi — BCA Dept. — Team 02</strong></p>
<p>Student: <strong>Vivek B M</strong> (USN: <code>01FE24BCA266</code>)</p>
<p>Server running on port <code>${PORT}</code> | Dataset: <code>${catalog.length} places</code> | Source: <code>${dbStatus.source}</code></p>
<h3>REST API Endpoints</h3>
<table>
<tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
<tr><td>GET</td><td><code>/api/health</code></td><td>Engine status, DB connection, algorithm info</td></tr>
<tr><td>GET</td><td><code>/api/categories</code></td><td>List all place categories</td></tr>
<tr><td>GET</td><td><code>/api/places?active=true</code></td><td>All active destinations</td></tr>
<tr><td>GET</td><td><code>/api/places/autocomplete?q=</code></td><td>Search suggestions (up to 8)</td></tr>
<tr><td>POST</td><td><code>/api/rank</code></td><td>Search + rank via CustomMaxHeap</td></tr>
<tr><td>GET</td><td><code>/api/audit-logs</code></td><td>Engine 1 audit trail (read-only)</td></tr>
<tr><td>GET</td><td><code>/api/benchmark</code></td><td>CustomMaxHeap vs Sort benchmark</td></tr>
</table>
</div></body></html>`);
}

/** GET /api/health */
function handleHealth(res) {
    sendJSON(res, 200, {
        status:          'ONLINE',
        engine:          'Engine 2: Logic & Rule',
        theme:           'Tourist Place Search and Ranking System',
        institution:     'KLE Technological University, Hubballi',
        student:         { name: 'Vivek B M', usn: '01FE24BCA266', role: 'Engine 2 Owner' },
        port:            PORT,
        dataset_size:    catalog.length,
        dataset_source:  dbStatus.source,
        db_connected:    dbStatus.connected,
        db_message:      dbStatus.message,
        hand_built_ds:   'Custom Binary Max-Heap (Priority Queue)',
        algorithm:       'Floyd O(N) buildHeap + O(K log N) top-K extraction',
        formula:         'Score = (w1 × Rating_norm) + (w2 × Pop_norm) + (w3 × PrefMatch) + (w4 × Proximity_norm)  ∈ [0,1]',
        cors_origin:     '*',
        non_violable_rules: [
            'Weights must be non-negative and sum to exactly 1.000 ± 0.005',
            'Composite score must be bounded in [0.000, 1.000]',
            'max_budget -1 means no limit; max_budget 0 means free places only',
            'category_id is a preference boost — not a hard category filter',
            'Deterministic tie-breaking: Score → Rating → Popularity → Name'
        ]
    });
}

/** GET /api/categories */
function handleCategories(res) {
    sendJSON(res, 200, { categories });
}

/** GET /api/places */
function handlePlaces(res, query) {
    const activeOnly = query.active !== 'false';
    let results = activeOnly ? catalog.filter(p => p.status === 'ACTIVE') : catalog;
    if (query.q) {
        const kw = query.q.trim().toLowerCase();
        results = results.filter(p =>
            (p.place_name  || '').toLowerCase().includes(kw) ||
            (p.city        || '').toLowerCase().includes(kw) ||
            (p.category_name || '').toLowerCase().includes(kw)
        );
    }
    sendJSON(res, 200, { count: results.length, places: results });
}

/** GET /api/places/autocomplete?q= */
function handleAutocomplete(res, query) {
    const q = (query.q || '').trim().toLowerCase();
    if (!q) return sendJSON(res, 200, { suggestions: [] });

    const suggestions = catalog
        .filter(p => p.status === 'ACTIVE' && (
            (p.place_name || '').toLowerCase().includes(q) ||
            (p.city       || '').toLowerCase().includes(q)
        ))
        .slice(0, 8)
        .map(p => ({
            place_id:      p.place_id,
            place_name:    p.place_name,
            city:          p.city,
            category_name: p.category_name
        }));

    sendJSON(res, 200, { suggestions });
}

/** POST /api/rank — main Engine 2 ranking endpoint */
async function handleRank(req, res) {
    let body;
    try {
        body = await parseBody(req);
    } catch (parseErr) {
        return sendJSON(res, 400, { error: parseErr.message });
    }

    try {
        // executeSearchAndRank lives in ranking_core.js — single canonical algorithm
        const result = executeSearchAndRank(catalog, body);
        sendJSON(res, 200, result);
    } catch (rankErr) {
        const isValidationError = rankErr.message.startsWith('VALIDATION') || rankErr.message.startsWith('RULE');
        sendJSON(res, isValidationError ? 400 : 500, {
            error:  rankErr.message,
            detail: isValidationError
                ? 'Fix the request parameters and retry.'
                : 'Internal ranking error. Check server logs.'
        });
    }
}

/** GET /api/audit-logs — read-only from Engine 1 if MySQL available */
async function handleAuditLogs(res) {
    if (db && dbStatus.connected) {
        try {
            const logs = await db.loadAuditLogs(50);
            return sendJSON(res, 200, { count: logs.length, source: 'mysql-tourist_db1', audit_logs: logs });
        } catch (e) { /* fall through to static */ }
    }
    // Static sample audit log (no MySQL)
    sendJSON(res, 200, {
        count: 2,
        source: 'static-sample',
        audit_logs: [
            { audit_id: 1, place_id:  9, action_type: 'UPDATE_ENTRY_FEE', old_entry_fee: 30, new_entry_fee: 35, old_rating: 4.50, new_rating: 4.50, old_status: 'ACTIVE', new_status: 'ACTIVE', performed_by: 'SYSTEM_ADMIN', performed_at: new Date().toISOString() },
            { audit_id: 2, place_id: 16, action_type: 'UPDATE_RATING',    old_entry_fee: 50, new_entry_fee: 50, old_rating: 4.90, new_rating: 4.95, old_status: 'ACTIVE', new_status: 'ACTIVE', performed_by: 'SYSTEM_ADMIN', performed_at: new Date().toISOString() }
        ]
    });
}

/** GET /api/benchmark?n=2000&k=10 */
function handleBenchmark(res, query) {
    const n = Math.min(parseInt(query.n) || 2000, 50000);
    const k = Math.min(parseInt(query.k) || 10, n);

    const synthetic = Array.from({ length: n }, (_, i) => ({
        place_id:        i + 1,
        place_name:      `Synthetic_Place_${i}`,
        composite_score: Math.random(),
        rating:          parseFloat((Math.random() * 5).toFixed(2)),
        popularity:      Math.floor(Math.random() * 100),
        distance_km:     parseFloat((Math.random() * 500).toFixed(1)),
        entry_fee:       parseFloat((Math.random() * 500).toFixed(0)),
        status:          'ACTIVE'
    }));

    // Benchmark 1: Hand-built CustomMaxHeap  O(N + K log N)
    const t0 = process.hrtime();
    const heap = new CustomMaxHeap();
    heap.buildHeap(synthetic.slice());
    const heapTopK = heap.getTopK(k);
    const t1 = process.hrtime(t0);
    const heapMs = parseFloat((t1[0] * 1000 + t1[1] / 1e6).toFixed(3));

    // Benchmark 2: Native Array.sort  O(N log N)
    const t2 = process.hrtime();
    const sortTopK = synthetic.slice().sort((a, b) => b.composite_score - a.composite_score).slice(0, k);
    const t3 = process.hrtime(t2);
    const sortMs = parseFloat((t3[0] * 1000 + t3[1] / 1e6).toFixed(3));

    sendJSON(res, 200, {
        benchmark: {
            dataset_size: n,
            top_k: k,
            custom_max_heap: { time_ms: heapMs, complexity: 'O(N + K log N)', top_result_score: heapTopK[0]?.composite_score },
            array_sort:      { time_ms: sortMs, complexity: 'O(N log N)',      top_result_score: sortTopK[0]?.composite_score },
            speedup_factor:  parseFloat((sortMs / (heapMs || 0.001)).toFixed(2))
        }
    });
}

// ============================================================================
// SECTION 5: REQUEST ROUTER
// ============================================================================
const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, CORS_HEADERS);
        return res.end();
    }

    const parsed   = url.parse(req.url, true);
    const pathname = parsed.pathname.replace(/\/$/, '') || '/';
    const query    = parsed.query;
    const method   = req.method;

    try {
        // ── GET /  ──────────────────────────────────────────────────────────
        if (pathname === '' || pathname === '/') {
            return handleRoot(res);
        }
        // ── GET /api/health  ────────────────────────────────────────────────
        if (pathname === '/api/health' && method === 'GET') {
            return handleHealth(res);
        }
        // ── GET /api/categories  ────────────────────────────────────────────
        if (pathname === '/api/categories' && method === 'GET') {
            return handleCategories(res);
        }
        // ── GET /api/places/autocomplete  ───────────────────────────────────
        // Must come BEFORE /api/places to avoid prefix collision
        if (pathname === '/api/places/autocomplete' && method === 'GET') {
            return handleAutocomplete(res, query);
        }
        // ── GET /api/places  ────────────────────────────────────────────────
        if (pathname === '/api/places' && method === 'GET') {
            return handlePlaces(res, query);
        }
        // ── POST /api/rank  ─────────────────────────────────────────────────
        if (pathname === '/api/rank' && method === 'POST') {
            return await handleRank(req, res);
        }
        // ── GET /api/audit-logs  ────────────────────────────────────────────
        if (pathname === '/api/audit-logs' && method === 'GET') {
            return await handleAuditLogs(res);
        }
        // ── GET /api/benchmark  ─────────────────────────────────────────────
        if (pathname === '/api/benchmark' && method === 'GET') {
            return handleBenchmark(res, query);
        }

        // ── 404 ─────────────────────────────────────────────────────────────
        sendJSON(res, 404, {
            error: `Route not found: ${method} ${pathname}`,
            available_routes: [
                'GET  /api/health',
                'GET  /api/categories',
                'GET  /api/places',
                'GET  /api/places/autocomplete?q=<term>',
                'POST /api/rank',
                'GET  /api/audit-logs',
                'GET  /api/benchmark'
            ]
        });

    } catch (unhandled) {
        console.error('[Engine 2] Unhandled error:', unhandled);
        sendJSON(res, 500, { error: 'Internal server error.', detail: unhandled.message });
    }
});

// ============================================================================
// SECTION 6: STARTUP
// ============================================================================
(async () => {
    await initDatabase();      // Try MySQL; fall back gracefully

    server.listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('════════════════════════════════════════════════════════════');
        console.log('  ENGINE 2 — LOGIC & RULE   |   Tourist Place Search & Ranking');
        console.log('  KLE Technological University, Hubballi — BCA Dept — Team 02');
        console.log('  Student : Vivek B M (01FE24BCA266)');
        console.log(`  Server  : http://localhost:${PORT}`);
        console.log(`  Dataset : ${catalog.length} places (source: ${dbStatus.source})`);
        console.log(`  DB      : ${dbStatus.connected ? '✓ MySQL tourist_db1' : '✗ Fallback (MySQL offline)'}`);
        console.log('  CORS    : enabled for all origins (Engine 3 @ localhost:5500 ✓)');
        console.log('════════════════════════════════════════════════════════════');
        console.log('');
    });
})();
