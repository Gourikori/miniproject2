/**
 * ====================================================================================================
 * Engine 2: API Integration Tests (test_engine2.js)
 * Tests the LIVE server.js REST API — not a copy of the algorithm.
 * Run:  node test_engine2.js
 * ====================================================================================================
 */

'use strict';

const http = require('http');

const BASE = 'http://localhost:5000';
let passed = 0, failed = 0;

// ── HTTP helpers ─────────────────────────────────────────────────────────────
function get(path) {
    return new Promise((resolve, reject) => {
        http.get(`${BASE}${path}`, res => {
            let raw = '';
            res.on('data', c => { raw += c; });
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch (e) { resolve({ status: res.statusCode, body: raw }); }
            });
        }).on('error', reject);
    });
}

function post(path, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const opts = {
            hostname: 'localhost', port: 5000,
            path, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        };
        const req = http.request(opts, res => {
            let raw = '';
            res.on('data', c => { raw += c; });
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch (e) { resolve({ status: res.statusCode, body: raw }); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// ── Test runner ───────────────────────────────────────────────────────────────
let testIndex = 0;
function assert(label, condition, detail = '') {
    testIndex++;
    if (condition) {
        console.log(`  ✓ [T${testIndex.toString().padStart(2,'0')}] ${label}`);
        passed++;
    } else {
        console.error(`  ✗ [T${testIndex.toString().padStart(2,'0')}] ${label}${detail ? '\n       → ' + detail : ''}`);
        failed++;
    }
}

// ── Test suites ───────────────────────────────────────────────────────────────
async function runTests() {
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  ENGINE 2 — API Integration Tests');
    console.log('  Target: http://localhost:5000');
    console.log('════════════════════════════════════════════════════════════\n');

    // ────────────────────────────────────────────────────────────────────────
    // SUITE A: Basic Connectivity
    // ────────────────────────────────────────────────────────────────────────
    console.log('[ SUITE A ] Basic Connectivity');
    {
        const r = await get('/api/health');
        assert('GET /api/health → 200', r.status === 200, `Got ${r.status}`);
        assert('health.status === ONLINE', r.body.status === 'ONLINE', JSON.stringify(r.body.status));
        assert('health.dataset_size >= 34', r.body.dataset_size >= 34, `Got ${r.body.dataset_size}`);
        assert('health.cors_origin === *', r.body.cors_origin === '*', `Got ${r.body.cors_origin}`);
    }

    // ────────────────────────────────────────────────────────────────────────
    // SUITE B: Categories
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[ SUITE B ] Categories');
    {
        const r = await get('/api/categories');
        assert('GET /api/categories → 200', r.status === 200, `Got ${r.status}`);
        assert('categories is an array', Array.isArray(r.body.categories), typeof r.body.categories);
        assert('categories.length >= 6', r.body.categories.length >= 6, `Got ${r.body.categories.length}`);
        assert('category has category_id field', r.body.categories[0].category_id !== undefined);
        assert('category has category_name field', r.body.categories[0].category_name !== undefined);
    }

    // ────────────────────────────────────────────────────────────────────────
    // SUITE C: Places Listing
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[ SUITE C ] Places Listing');
    {
        const r = await get('/api/places?active=true');
        assert('GET /api/places → 200', r.status === 200, `Got ${r.status}`);
        assert('places.count >= 34', r.body.count >= 34, `Got ${r.body.count}`);
        assert('places array present', Array.isArray(r.body.places));
        const p = r.body.places[0];
        assert('place has place_id',      p && p.place_id      !== undefined);
        assert('place has place_name',    p && p.place_name    !== undefined);
        assert('place has city',          p && p.city          !== undefined);
        assert('place has rating',        p && p.rating        !== undefined);
        assert('place has entry_fee',     p && p.entry_fee     !== undefined);
        assert('place has distance_km',   p && p.distance_km   !== undefined);
        assert('place has category_name', p && p.category_name !== undefined);
    }

    // ────────────────────────────────────────────────────────────────────────
    // SUITE D: Autocomplete
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[ SUITE D ] Autocomplete');
    {
        const r = await get('/api/places/autocomplete?q=hampi');
        assert('GET /api/places/autocomplete?q=hampi → 200', r.status === 200);
        assert('suggestions is array', Array.isArray(r.body.suggestions));
        assert('hampi suggestions found', r.body.suggestions.length > 0, 'No hampi results');
        assert('suggestion has place_name', r.body.suggestions[0]?.place_name !== undefined);

        const r2 = await get('/api/places/autocomplete?q=');
        assert('empty q returns empty array', Array.isArray(r2.body.suggestions) && r2.body.suggestions.length === 0);
    }

    // ────────────────────────────────────────────────────────────────────────
    // SUITE E: POST /api/rank — basic ranking
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[ SUITE E ] POST /api/rank — Basic Ranking');
    {
        const r = await post('/api/rank', { keyword: '', max_budget: -1, max_distance: -1, top_k: 5 });
        assert('POST /api/rank → 200', r.status === 200, `Got ${r.status}`);
        assert('results array present', Array.isArray(r.body.results));
        assert('metadata present', r.body.metadata !== undefined);
        assert('top 5 returned', r.body.results.length <= 5);
        const top = r.body.results[0];
        assert('result has composite_score', top && top.composite_score !== undefined);
        assert('composite_score in [0,1]', top && top.composite_score >= 0 && top.composite_score <= 1,
            `Got ${top?.composite_score}`);
        assert('result has breakdown', top && top.breakdown !== undefined);
        assert('breakdown has weighted_rating', top?.breakdown?.weighted_rating !== undefined);
        assert('metadata has algorithm field', r.body.metadata.algorithm !== undefined);
        assert('metadata has candidate_pool_size', r.body.metadata.candidate_pool_size >= 0);
    }

    // ────────────────────────────────────────────────────────────────────────
    // SUITE F: Budget Filters
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[ SUITE F ] Budget Filters');
    {
        // max_budget: 0 → free places only
        const r0 = await post('/api/rank', { max_budget: 0, top_k: 34 });
        assert('max_budget:0 → 200', r0.status === 200);
        const freeOk = r0.body.results.every(p => p.entry_fee === 0 || p.entry_fee <= 0);
        assert('max_budget:0 → all free places', freeOk, 'Some results have entry_fee > 0');
        assert('max_budget:0 → at least 1 result', r0.body.results.length >= 1);

        // max_budget: -1 → no limit
        const rm1 = await post('/api/rank', { max_budget: -1, top_k: 34 });
        assert('max_budget:-1 → 200', rm1.status === 200);
        assert('max_budget:-1 → all 34 places in pool', rm1.body.metadata.candidate_pool_size >= 34);
    }

    // ────────────────────────────────────────────────────────────────────────
    // SUITE G: Rating Filter
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[ SUITE G ] Rating Filter');
    {
        const r = await post('/api/rank', { min_rating: 4.5, top_k: 34 });
        assert('min_rating:4.5 → 200', r.status === 200);
        const ratingOk = r.body.results.every(p => p.rating >= 4.5);
        assert('min_rating:4.5 → all results ≥ 4.5', ratingOk,
            'Some results have rating < 4.5');
    }

    // ────────────────────────────────────────────────────────────────────────
    // SUITE H: Sort Modes
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[ SUITE H ] Sort Modes');
    {
        const rDist = await post('/api/rank', { sort_by: 'distance', top_k: 10 });
        assert('sort_by:distance → 200', rDist.status === 200);
        const distAsc = rDist.body.results.every((p, i, arr) =>
            i === 0 || p.distance_km >= arr[i-1].distance_km);
        assert('sort_by:distance → ascending order', distAsc);

        const rFee = await post('/api/rank', { sort_by: 'fee', top_k: 10 });
        assert('sort_by:fee → 200', rFee.status === 200);
        const feeAsc = rFee.body.results.every((p, i, arr) =>
            i === 0 || p.entry_fee >= arr[i-1].entry_fee);
        assert('sort_by:fee → ascending order', feeAsc);

        const rPop = await post('/api/rank', { sort_by: 'popularity', top_k: 10 });
        assert('sort_by:popularity → 200', rPop.status === 200);
        const popDesc = rPop.body.results.every((p, i, arr) =>
            i === 0 || p.popularity <= arr[i-1].popularity);
        assert('sort_by:popularity → descending order', popDesc);

        const rRating = await post('/api/rank', { sort_by: 'rating', top_k: 10 });
        assert('sort_by:rating → 200', rRating.status === 200);
        const ratingDesc = rRating.body.results.every((p, i, arr) =>
            i === 0 || p.rating <= arr[i-1].rating);
        assert('sort_by:rating → descending order', ratingDesc);
    }

    // ────────────────────────────────────────────────────────────────────────
    // SUITE I: Keyword Search
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[ SUITE I ] Keyword Search');
    {
        const r = await post('/api/rank', { keyword: 'beach', top_k: 10 });
        assert('keyword:beach → 200', r.status === 200);
        assert('keyword:beach → results found', r.body.results.length > 0);
        const allBeach = r.body.results.every(p =>
            (p.place_name || '').toLowerCase().includes('beach') ||
            (p.city       || '').toLowerCase().includes('beach') ||
            (p.category_name || '').toLowerCase().includes('beach') ||
            (p.description   || '').toLowerCase().includes('beach')
        );
        assert('keyword:beach → all results contain "beach"', allBeach);

        const rNoMatch = await post('/api/rank', { keyword: 'zzznomatchxxx', top_k: 10 });
        assert('no-match keyword → 200 with empty results', rNoMatch.status === 200 && rNoMatch.body.results.length === 0);
    }

    // ────────────────────────────────────────────────────────────────────────
    // SUITE J: Category Preference Boost
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[ SUITE J ] Category Preference Boost');
    {
        const r = await post('/api/rank', { category_id: 1, top_k: 10 }); // Beach preferred
        assert('category_id:1 preference → 200', r.status === 200);
        const topResult = r.body.results[0];
        // Beach places should have preference_match = 1 in breakdown
        const beachHasBoost = r.body.results
            .filter(p => p.category_id === 1)
            .every(p => p.breakdown?.preference_match === 1.0);
        assert('Beach places have preference_match=1', beachHasBoost);
        const nonBeachNoBoost = r.body.results
            .filter(p => p.category_id !== 1)
            .every(p => p.breakdown?.preference_match === 0.0);
        assert('Non-Beach places have preference_match=0', nonBeachNoBoost);
    }

    // ────────────────────────────────────────────────────────────────────────
    // SUITE K: Validation Errors (400)
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[ SUITE K ] Validation Errors');
    {
        // Invalid weights sum
        const rW = await post('/api/rank', { weights: { wRating: 0.5, wPopularity: 0.5, wPreference: 0.5, wDistance: 0.5 } });
        assert('invalid weights sum → 400', rW.status === 400, `Got ${rW.status}`);
        assert('invalid weights → error message', typeof rW.body.error === 'string');

        // Negative budget
        const rB = await post('/api/rank', { max_budget: -50 });
        assert('negative budget (not -1) → 400', rB.status === 400, `Got ${rB.status}`);

        // min_rating out of range
        const rR = await post('/api/rank', { min_rating: 6.0 });
        assert('min_rating:6.0 → 400', rR.status === 400, `Got ${rR.status}`);

        // Invalid sort_by
        const rS = await post('/api/rank', { sort_by: 'foobar' });
        assert('invalid sort_by → 400', rS.status === 400, `Got ${rS.status}`);

        // Malformed JSON
        const badReq = await new Promise((resolve, reject) => {
            const data = 'not-json-at-all{{{';
            const opts = {
                hostname: 'localhost', port: 5000, path: '/api/rank', method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
            };
            const req = http.request(opts, res => {
                let raw = ''; res.on('data', c => raw += c);
                res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); } catch (e) { resolve({ status: res.statusCode, body: raw }); } });
            });
            req.on('error', reject);
            req.write(data); req.end();
        });
        assert('malformed JSON body → 400', badReq.status === 400, `Got ${badReq.status}`);
    }

    // ────────────────────────────────────────────────────────────────────────
    // SUITE L: 34-Place Dataset Completeness
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[ SUITE L ] 34-Place Dataset Completeness');
    {
        const r = await post('/api/rank', { max_budget: -1, max_distance: -1, top_k: 100 });
        assert('full dataset → 200', r.status === 200);
        assert('candidate pool = 34', r.body.metadata.candidate_pool_size === 34,
            `Got ${r.body.metadata.candidate_pool_size}`);
        assert('returned up to 34 results', r.body.results.length <= 34);
    }

    // ────────────────────────────────────────────────────────────────────────
    // SUITE M: 404 for unknown routes
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n[ SUITE M ] 404 Handling');
    {
        const r = await get('/api/nonexistent-route');
        assert('unknown route → 404', r.status === 404, `Got ${r.status}`);
        assert('404 has error field', typeof r.body.error === 'string');
    }

    // ────────────────────────────────────────────────────────────────────────
    // SUMMARY
    // ────────────────────────────────────────────────────────────────────────
    const total = passed + failed;
    console.log('\n════════════════════════════════════════════════════════════');
    console.log(`  RESULTS: ${passed}/${total} passed | ${failed} failed`);
    if (failed === 0) {
        console.log('  ✓ ALL TESTS PASSED — Engine 2 is ready for Engine 3 connection!');
    } else {
        console.log(`  ✗ ${failed} test(s) failed — review output above.`);
    }
    console.log('════════════════════════════════════════════════════════════\n');
    process.exit(failed > 0 ? 1 : 0);
}

// ── Retry connection with timeout ─────────────────────────────────────────────
async function waitForServer(retries = 10, delay = 500) {
    for (let i = 0; i < retries; i++) {
        try {
            await get('/api/health');
            return true;
        } catch (_) {
            await new Promise(r => setTimeout(r, delay));
        }
    }
    return false;
}

(async () => {
    console.log('\n[Test] Waiting for Engine 2 server on localhost:5000 ...');
    const up = await waitForServer();
    if (!up) {
        console.error('[Test] FATAL: Server not reachable. Start it first:\n  node server.js\n');
        process.exit(1);
    }
    await runTests();
})();
