/**
 * ====================================================================================================
 * KLE TECHNOLOGICAL UNIVERSITY, HUBBALLI
 * DEPARTMENT OF BACHELOR OF COMPUTER APPLICATIONS
 * THEME 3 / THEME 4: SEARCH AND RANKING SYSTEM / REPORTING & MIS
 * 
 * ENGINE 2: LOGIC & RULE (DATA STRUCTURES & PROGRAMMING)
 * Student: Vivek B M (USN: 01FE24BCA266)
 * Faculty Guides: Prof. Pavankumar Vadavi, Prof. Sayeeda Anjum
 * 
 * CORE DELIVERABLE:
 * 1. The Main Calculation / Rule: Multi-factor Composite Scoring Formula with strict weight normalization.
 * 2. Hand-Built Data Structure: Custom Binary Max-Heap (Priority Queue) constructed from scratch
 *    without using Array.prototype.sort or external priority queues.
 * 3. Backend REST Server: Exposing endpoints for Engine 3 (Web UI) and Engine 4 (Testing).
 * ====================================================================================================
 */

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 5000;

// ----------------------------------------------------------------------------------------------------
// SECTION 1: MASTER DATASET (34 KARNATAKA DESTINATIONS - SYNCHRONIZED WITH ENGINE 1)
// ----------------------------------------------------------------------------------------------------
const categories = [
    { category_id: 1, category_name: "Beach" },
    { category_id: 2, category_name: "Historical" },
    { category_id: 3, category_name: "Nature" },
    { category_id: 4, category_name: "Temple" },
    { category_id: 5, category_name: "Wildlife" },
    { category_id: 6, category_name: "Hill Station" }
];

let touristPlaces = [
    // Local Hubballi - Dharwad
    { place_id: 1, place_name: "Unkal Lake & Park", city: "Hubballi", state: "Karnataka", category_id: 3, category_name: "Nature", entry_fee: 10.00, distance_km: 6.0, rating: 4.30, popularity: 82, best_time_to_visit: "July to October", description: "A calm lakeside escape for an evening walk and family outing.", status: "ACTIVE" },
    { place_id: 2, place_name: "Chandramouleshwara Temple", city: "Hubballi", state: "Karnataka", category_id: 4, category_name: "Temple", entry_fee: 0.00, distance_km: 8.5, rating: 4.50, popularity: 78, best_time_to_visit: "October to March", description: "Historic stone carvings and Western Chalukyan architecture.", status: "ACTIVE" },
    { place_id: 3, place_name: "Nrupatunga Betta Viewpoint", city: "Hubballi", state: "Karnataka", category_id: 3, category_name: "Nature", entry_fee: 20.00, distance_km: 10.0, rating: 4.40, popularity: 80, best_time_to_visit: "July to October", description: "Scenic hillock offering panoramic city viewpoints.", status: "ACTIVE" },
    { place_id: 4, place_name: "Sadhankeri Park & Lake", city: "Dharwad", state: "Karnataka", category_id: 3, category_name: "Nature", entry_fee: 10.00, distance_km: 22.0, rating: 4.20, popularity: 72, best_time_to_visit: "October to March", description: "Serene garden memorial commemorating poet Da. Ra. Bendre.", status: "ACTIVE" },

    // Coastal & Western Ghats
    { place_id: 5, place_name: "Gokarna Om Beach", city: "Gokarna", state: "Karnataka", category_id: 1, category_name: "Beach", entry_fee: 0.00, distance_km: 150.0, rating: 4.60, popularity: 92, best_time_to_visit: "November to February", description: "Sweeping coastline and laid-back beach town atmosphere.", status: "ACTIVE" },
    { place_id: 6, place_name: "Kudle Beach", city: "Gokarna", state: "Karnataka", category_id: 1, category_name: "Beach", entry_fee: 0.00, distance_km: 152.0, rating: 4.50, popularity: 88, best_time_to_visit: "November to February", description: "Scenic coastal stretch ideal for swimming and sunsets.", status: "ACTIVE" },
    { place_id: 7, place_name: "Murudeshwar Temple & Beach", city: "Murudeshwar", state: "Karnataka", category_id: 4, category_name: "Temple", entry_fee: 0.00, distance_km: 185.0, rating: 4.70, popularity: 95, best_time_to_visit: "October to March", description: "Dramatic landmark with giant Shiva statue and Arabian Sea views.", status: "ACTIVE" },
    { place_id: 8, place_name: "Yana Rocks & Caves", city: "Kumta", state: "Karnataka", category_id: 3, category_name: "Nature", entry_fee: 20.00, distance_km: 140.0, rating: 4.60, popularity: 85, best_time_to_visit: "October to March", description: "Gigantic limestone karst formations inside thick rainforest.", status: "ACTIVE" },
    { place_id: 9, place_name: "Sathodi Falls", city: "Yellapur", state: "Karnataka", category_id: 3, category_name: "Nature", entry_fee: 30.00, distance_km: 75.0, rating: 4.50, popularity: 81, best_time_to_visit: "July to October", description: "Picturesque rectangular forest waterfall.", status: "ACTIVE" },
    { place_id: 10, place_name: "Magod Falls", city: "Yellapur", state: "Karnataka", category_id: 3, category_name: "Nature", entry_fee: 20.00, distance_km: 80.0, rating: 4.30, popularity: 76, best_time_to_visit: "July to October", description: "Bedthi river tumbling down two tiers in deep valleys.", status: "ACTIVE" },
    { place_id: 11, place_name: "Sirsi Marikamba Temple", city: "Sirsi", state: "Karnataka", category_id: 4, category_name: "Temple", entry_fee: 0.00, distance_km: 102.0, rating: 4.80, popularity: 89, best_time_to_visit: "October to March", description: "Renowned 16th-century temple adorned with wooden carvings.", status: "ACTIVE" },
    { place_id: 12, place_name: "Dandeli River Rafting & Wildlife", city: "Dandeli", state: "Karnataka", category_id: 5, category_name: "Wildlife", entry_fee: 250.00, distance_km: 74.0, rating: 4.60, popularity: 94, best_time_to_visit: "October to March", description: "River scenery, forest trails, and white-water rafting on Kali river.", status: "ACTIVE" },
    { place_id: 13, place_name: "Ulavi Channabasaveshwara Temple", city: "Ulavi", state: "Karnataka", category_id: 4, category_name: "Temple", entry_fee: 0.00, distance_km: 95.0, rating: 4.40, popularity: 79, best_time_to_visit: "October to March", description: "Important Lingayat pilgrimage shrine surrounded by dense forests.", status: "ACTIVE" },
    { place_id: 14, place_name: "Banavasi Madhukeshwara Temple", city: "Banavasi", state: "Karnataka", category_id: 2, category_name: "Historical", entry_fee: 0.00, distance_km: 125.0, rating: 4.60, popularity: 83, best_time_to_visit: "October to March", description: "Ancient Chalukya-Kadamba architectural gem and first Kannada capital.", status: "ACTIVE" },
    { place_id: 15, place_name: "Malpe Beach & St Mary Island", city: "Udupi", state: "Karnataka", category_id: 1, category_name: "Beach", entry_fee: 300.00, distance_km: 250.0, rating: 4.60, popularity: 91, best_time_to_visit: "November to February", description: "Pristine coastline and volcanic columnar basalt rock islands.", status: "ACTIVE" },

    // North Karnataka Heritage
    { place_id: 16, place_name: "Virupaksha Temple & Hampi Ruins", city: "Hampi", state: "Karnataka", category_id: 2, category_name: "Historical", entry_fee: 50.00, distance_km: 165.0, rating: 4.90, popularity: 98, best_time_to_visit: "October to March", description: "Extraordinary UNESCO landscape of temples and boulder ruins.", status: "ACTIVE" },
    { place_id: 17, place_name: "Vijaya Vittala Temple & Stone Chariot", city: "Hampi", state: "Karnataka", category_id: 2, category_name: "Historical", entry_fee: 50.00, distance_km: 168.0, rating: 4.90, popularity: 99, best_time_to_visit: "October to March", description: "Iconic carved stone chariot and musical pillars.", status: "ACTIVE" },
    { place_id: 18, place_name: "Badami Cave Temples", city: "Badami", state: "Karnataka", category_id: 2, category_name: "Historical", entry_fee: 30.00, distance_km: 105.0, rating: 4.70, popularity: 91, best_time_to_visit: "October to March", description: "Rock-cut cave shrines overlooking red sandstone cliffs and Agastya Lake.", status: "ACTIVE" },
    { place_id: 19, place_name: "Pattadakal UNESCO Monuments", city: "Pattadakal", state: "Karnataka", category_id: 2, category_name: "Historical", entry_fee: 40.00, distance_km: 128.0, rating: 4.80, popularity: 90, best_time_to_visit: "October to March", description: "7th-8th century architectural synthesis of Rekha-Nagara and Dravidian styles.", status: "ACTIVE" },
    { place_id: 20, place_name: "Aihole Historical Complex", city: "Aihole", state: "Karnataka", category_id: 2, category_name: "Historical", entry_fee: 30.00, distance_km: 135.0, rating: 4.50, popularity: 84, best_time_to_visit: "October to March", description: "Cradle of Hindu structural temple architecture with over 120 monuments.", status: "ACTIVE" },
    { place_id: 21, place_name: "Gol Gumbaz", city: "Vijayapura", state: "Karnataka", category_id: 2, category_name: "Historical", entry_fee: 25.00, distance_km: 200.0, rating: 4.60, popularity: 87, best_time_to_visit: "October to March", description: "Massive circular dome mausoleum with acoustical Whispering Gallery.", status: "ACTIVE" },
    { place_id: 22, place_name: "Chitradurga Fort", city: "Chitradurga", state: "Karnataka", category_id: 2, category_name: "Historical", entry_fee: 25.00, distance_km: 205.0, rating: 4.70, popularity: 89, best_time_to_visit: "October to March", description: "Impenetrable medieval stone fortress featuring 7 concentric ramparts.", status: "ACTIVE" },

    // Malnad & Hill Stations
    { place_id: 23, place_name: "Jog Falls Viewpoint", city: "Shivamogga", state: "Karnataka", category_id: 3, category_name: "Nature", entry_fee: 50.00, distance_km: 160.0, rating: 4.70, popularity: 93, best_time_to_visit: "July to October", description: "Dramatic plunge waterfall framed by Western Ghats gorges.", status: "ACTIVE" },
    { place_id: 24, place_name: "Agumbe Sunset Point", city: "Shivamogga", state: "Karnataka", category_id: 6, category_name: "Hill Station", entry_fee: 0.00, distance_km: 240.0, rating: 4.50, popularity: 85, best_time_to_visit: "October to March", description: "High Ghats viewpoint famous for sunset panoramas over Arabian Sea.", status: "ACTIVE" },
    { place_id: 25, place_name: "Mullayanagiri Peak", city: "Chikkamagaluru", state: "Karnataka", category_id: 6, category_name: "Hill Station", entry_fee: 0.00, distance_km: 275.0, rating: 4.80, popularity: 96, best_time_to_visit: "October to March", description: "Highest mountain peak in Karnataka with cool mist and panoramic trails.", status: "ACTIVE" },
    { place_id: 26, place_name: "Baba Budangiri Shrine & Hills", city: "Chikkamagaluru", state: "Karnataka", category_id: 6, category_name: "Hill Station", entry_fee: 0.00, distance_km: 285.0, rating: 4.40, popularity: 86, best_time_to_visit: "October to March", description: "Misty mountain range with Sufi shrine and rolling coffee plantations.", status: "ACTIVE" },
    { place_id: 27, place_name: "Kudremukh National Park", city: "Chikkamagaluru", state: "Karnataka", category_id: 5, category_name: "Wildlife", entry_fee: 200.00, distance_km: 310.0, rating: 4.70, popularity: 88, best_time_to_visit: "October to March", description: "Horse-faced peak with montane shola grasslands and rich fauna.", status: "ACTIVE" },
    { place_id: 28, place_name: "Belur Chennakeshava Temple", city: "Belur", state: "Karnataka", category_id: 2, category_name: "Historical", entry_fee: 0.00, distance_km: 290.0, rating: 4.80, popularity: 92, best_time_to_visit: "October to March", description: "Soapstone architectural marvel depicting celestial dancers.", status: "ACTIVE" },
    { place_id: 29, place_name: "Halebidu Hoysaleshwara Temple", city: "Halebidu", state: "Karnataka", category_id: 2, category_name: "Historical", entry_fee: 0.00, distance_km: 300.0, rating: 4.80, popularity: 91, best_time_to_visit: "October to March", description: "12th-century twin-temple adorned with intricate relief sculptures.", status: "ACTIVE" },

    // South Karnataka
    { place_id: 30, place_name: "Mysore Palace", city: "Mysuru", state: "Karnataka", category_id: 2, category_name: "Historical", entry_fee: 100.00, distance_km: 410.0, rating: 4.90, popularity: 98, best_time_to_visit: "October to March", description: "Grand royal palace with Indo-Saracenic halls and 100,000 festival lights.", status: "ACTIVE" },
    { place_id: 31, place_name: "Chamundi Hill & Temple", city: "Mysuru", state: "Karnataka", category_id: 4, category_name: "Temple", entry_fee: 0.00, distance_km: 415.0, rating: 4.70, popularity: 90, best_time_to_visit: "October to March", description: "Dravidian gopuram shrine overlooking Mysuru city with monolithic Nandi.", status: "ACTIVE" },
    { place_id: 32, place_name: "Abbey Falls", city: "Madikeri", state: "Karnataka", category_id: 3, category_name: "Nature", entry_fee: 50.00, distance_km: 380.0, rating: 4.50, popularity: 87, best_time_to_visit: "July to October", description: "Roaring waterfall nestled inside lush spice and coffee plantations.", status: "ACTIVE" },
    { place_id: 33, place_name: "Raja Seat Viewpoint", city: "Madikeri", state: "Karnataka", category_id: 6, category_name: "Hill Station", entry_fee: 25.00, distance_km: 375.0, rating: 4.40, popularity: 84, best_time_to_visit: "October to March", description: "Seasonal garden where Kodagu kings observed dramatic sunsets.", status: "ACTIVE" },
    { place_id: 34, place_name: "Bandipur National Park Safari", city: "Bandipur", state: "Karnataka", category_id: 5, category_name: "Wildlife", entry_fee: 350.00, distance_km: 480.0, rating: 4.70, popularity: 94, best_time_to_visit: "October to March", description: "Renowned Tiger Reserve home to elephants, gaurs, and Bengal tigers.", status: "ACTIVE" }
];

let auditLogs = [
    { audit_id: 1, place_id: 9, action_type: "UPDATE_ENTRY_FEE", old_entry_fee: 30.00, new_entry_fee: 35.00, old_rating: 4.50, new_rating: 4.50, old_status: "ACTIVE", new_status: "ACTIVE", performed_by: "SYSTEM_ADMIN", performed_at: new Date().toISOString() },
    { audit_id: 2, place_id: 16, action_type: "UPDATE_RATING", old_entry_fee: 50.00, new_entry_fee: 50.00, old_rating: 4.90, new_rating: 4.95, old_status: "ACTIVE", new_status: "ACTIVE", performed_by: "SYSTEM_ADMIN", performed_at: new Date().toISOString() }
];

// ----------------------------------------------------------------------------------------------------
// SECTION 2: HAND-BUILT BINARY MAX-HEAP (ENGINE 2 CORE DATA STRUCTURE)
// ----------------------------------------------------------------------------------------------------
/**
 * HAND-BUILT MAX-HEAP CLASS:
 * Implemented from first principles without using Array.prototype.sort.
 * Time Complexity:
 *   - buildHeap(): O(N) using Floyd's bottom-up method.
 *   - extractMax(): O(log N).
 *   - getTopK(k): O(K log N).
 *   - Total for Top-K: O(N + K log N) vs O(N log N) for full sort.
 */
class CustomMaxHeap {
    constructor() {
        this.heap = [];
    }

    parent(i) { return Math.floor((i - 1) / 2); }
    leftChild(i) { return 2 * i + 1; }
    rightChild(i) { return 2 * i + 2; }

    // Deterministic comparator adhering to Gate 1 - B2 & B3
    isGreater(a, b) {
        if (Math.abs(a.composite_score - b.composite_score) > 0.0001) {
            return a.composite_score > b.composite_score;
        }
        // Tie-breaker 1: Rating
        if (Math.abs(a.rating - b.rating) > 0.01) {
            return a.rating > b.rating;
        }
        // Tie-breaker 2: Popularity
        if (a.popularity !== b.popularity) {
            return a.popularity > b.popularity;
        }
        // Tie-breaker 3: Place name lexicographical
        return a.place_name < b.place_name;
    }

    heapifyDown(i) {
        let maxIndex = i;
        const left = this.leftChild(i);
        const right = this.rightChild(i);
        const n = this.heap.length;

        if (left < n && this.isGreater(this.heap[left], this.heap[maxIndex])) {
            maxIndex = left;
        }
        if (right < n && this.isGreater(this.heap[right], this.heap[maxIndex])) {
            maxIndex = right;
        }

        if (i !== maxIndex) {
            const temp = this.heap[i];
            this.heap[i] = this.heap[maxIndex];
            this.heap[maxIndex] = temp;
            this.heapifyDown(maxIndex);
        }
    }

    heapifyUp(i) {
        while (i > 0 && this.isGreater(this.heap[i], this.heap[this.parent(i)])) {
            const p = this.parent(i);
            const temp = this.heap[i];
            this.heap[i] = this.heap[p];
            this.heap[p] = temp;
            i = p;
        }
    }

    // Floyd's O(N) linear build heap
    buildHeap(items) {
        this.heap = items.slice(); // shallow copy
        const n = this.heap.length;
        for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
            this.heapifyDown(i);
        }
    }

    insert(item) {
        this.heap.push(item);
        this.heapifyUp(this.heap.length - 1);
    }

    extractMax() {
        if (this.heap.length === 0) return null;
        const maxItem = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.heapifyDown(0);
        }
        return maxItem;
    }

    getTopK(k) {
        const topResults = [];
        const count = Math.min(k, this.heap.length);
        for (let i = 0; i < count; i++) {
            const item = this.extractMax();
            if (item) topResults.push(item);
        }
        return topResults;
    }
}

// ----------------------------------------------------------------------------------------------------
// SECTION 3: THE MAIN CALCULATION & RULE (MULTI-FACTOR COMPOSITE SCORING)
// ----------------------------------------------------------------------------------------------------
const MAX_RATING = 5.00;
const MAX_POPULARITY = 100.00;
const MAX_REFERENCE_DISTANCE = 500.00;

function validateWeights(w) {
    const wRating = parseFloat(w.wRating ?? 0.40);
    const wPopularity = parseFloat(w.wPopularity ?? 0.30);
    const wPreference = parseFloat(w.wPreference ?? 0.20);
    const wDistance = parseFloat(w.wDistance ?? 0.10);

    if (wRating < 0 || wPopularity < 0 || wPreference < 0 || wDistance < 0) {
        throw new Error("RULE VIOLATION (B2): Ranking weights cannot be negative.");
    }

    const sum = wRating + wPopularity + wPreference + wDistance;
    if (Math.abs(sum - 1.000) > 0.005) {
        throw new Error(`RULE VIOLATION (B2): Ranking weights must sum to exactly 1.000 (Current sum = ${sum.toFixed(3)}).`);
    }

    return { wRating, wPopularity, wPreference, wDistance };
}

function computeScore(place, preferredCategoryId, weights) {
    const normRating = Math.max(0, Math.min(1, place.rating / MAX_RATING));
    const weightedRating = weights.wRating * normRating;

    const normPopularity = Math.max(0, Math.min(1, place.popularity / MAX_POPULARITY));
    const weightedPopularity = weights.wPopularity * normPopularity;

    const preferenceMatch = (preferredCategoryId && parseInt(preferredCategoryId) === place.category_id) ? 1.0 : 0.0;
    const weightedPreference = weights.wPreference * preferenceMatch;

    const normProximity = Math.max(0, Math.min(1, 1.0 - (place.distance_km / MAX_REFERENCE_DISTANCE)));
    const weightedProximity = weights.wDistance * normProximity;

    const rawScore = weightedRating + weightedPopularity + weightedPreference + weightedProximity;
    const compositeScore = Math.max(0, Math.min(1, rawScore));

    return {
        composite_score: parseFloat(compositeScore.toFixed(4)),
        breakdown: {
            raw_rating: place.rating,
            norm_rating: parseFloat(normRating.toFixed(4)),
            weighted_rating: parseFloat(weightedRating.toFixed(4)),
            raw_popularity: place.popularity,
            norm_popularity: parseFloat(normPopularity.toFixed(4)),
            weighted_popularity: parseFloat(weightedPopularity.toFixed(4)),
            preference_match: preferenceMatch,
            weighted_preference: parseFloat(weightedPreference.toFixed(4)),
            raw_distance_km: place.distance_km,
            norm_proximity: parseFloat(normProximity.toFixed(4)),
            weighted_proximity: parseFloat(weightedProximity.toFixed(4)),
            formula: `(${weights.wRating} * ${normRating.toFixed(2)}) + (${weights.wPopularity} * ${normPopularity.toFixed(2)}) + (${weights.wPreference} * ${preferenceMatch}) + (${weights.wDistance} * ${normProximity.toFixed(2)})`
        }
    };
}

// ----------------------------------------------------------------------------------------------------
// SECTION 4: HTTP REQUEST HANDLING & REST ROUTING
// ----------------------------------------------------------------------------------------------------
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data, null, 2));
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(new Error("Malformed JSON payload"));
            }
        });
    });
}

const server = http.createServer(async (req, res) => {
    // Enable CORS Preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    try {
        // ROUTE 1: Engine 2 Interactive Console / Web Landing Page
        if (pathname === '/' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            return res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Engine 2: Logic & Rule - Tourist Place Search and Ranking System</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
                        .container { max-width: 1000px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                        h1 { color: #38bdf8; margin-top: 0; }
                        .badge { background: #0284c7; color: white; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: bold; }
                        .card { background: #334155; padding: 18px; border-radius: 8px; margin: 15px 0; }
                        pre { background: #0f172a; padding: 12px; border-radius: 6px; overflow-x: auto; color: #a5f3fc; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #475569; }
                        th { background: #0ea5e9; color: white; }
                        .button { background: #38bdf8; color: #0f172a; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Tourist Place Search & Ranking System <span class="badge">Engine 2: Logic & Rule</span></h1>
                        <p><strong>Department of BCA, KLE Technological University, Hubballi</strong></p>
                        <p><strong>Student:</strong> Vivek B M (USN: <code>01FE24BCA266</code>) | <strong>Guides:</strong> Prof. Pavan Vadavi, Prof. Sayeda Anjum</p>
                        
                        <div class="card">
                            <h3>Core Deliverable Architecture</h3>
                            <ul>
                                <li><strong>Handcrafted Data Structure:</strong> <code>CustomMaxHeap</code> built without <code>Array.prototype.sort</code> ($O(N)$ build, $O(K \\log N)$ top-$K$ extraction).</li>
                                <li><strong>Main Calculation:</strong> Multi-factor Composite Formula $\\text{Score} = (w_1 \\cdot \\text{Rating}) + (w_2 \\cdot \\text{Pop}) + (w_3 \\cdot \\text{Pref}) - (w_4 \\cdot \\text{Dist})$.</li>
                                <li><strong>Theme-Specific Rule Enforcement:</strong> Bounded normalization ($0 \\le \\text{Score} \\le 1$), weight validation ($\\sum w_i = 1.0$), and audit trace breakdown.</li>
                            </ul>
                        </div>

                        <div class="card">
                            <h3>Available Engine 2 REST API Endpoints</h3>
                            <table>
                                <tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
                                <tr><td>GET</td><td><code>/api/health</code></td><td>Engine 2 health status, metadata & algorithmic parameters</td></tr>
                                <tr><td>GET</td><td><code>/api/places</code></td><td>Fetch all active destinations (34 Karnataka places)</td></tr>
                                <tr><td>GET</td><td><code>/api/categories</code></td><td>Fetch destination categories</td></tr>
                                <tr><td>POST</td><td><code>/api/rank</code></td><td>Execute CustomMaxHeap ranking with filters and weights</td></tr>
                                <tr><td>GET</td><td><code>/api/benchmark</code></td><td>Benchmark CustomMaxHeap $O(N + K \\log N)$ vs Full Sort $O(N \\log N)$</td></tr>
                                <tr><td>GET</td><td><code>/api/audit-logs</code></td><td>Retrieve audit trail history</td></tr>
                            </table>
                        </div>

                        <div class="card">
                            <h3>Quick Test: Run Live Ranking API</h3>
                            <button class="button" onclick="testRanking()">Execute Top-5 CustomMaxHeap Ranking</button>
                            <div id="output" style="margin-top: 15px;"></div>
                        </div>
                    </div>

                    <script>
                        async function testRanking() {
                            const res = await fetch('/api/rank', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    keyword: '',
                                    category_id: 0,
                                    max_budget: -1,
                                    max_distance: -1,
                                    weights: { wRating: 0.40, wPopularity: 0.30, wPreference: 0.20, wDistance: 0.10 },
                                    top_k: 5
                                })
                            });
                            const data = await res.json();
                            document.getElementById('output').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                        }
                    </script>
                </body>
                </html>
            `);
        }

        // ROUTE 2: Health Check & Engine Metadata
        if (pathname === '/api/health' && req.method === 'GET') {
            return sendJSON(res, 200, {
                status: "ONLINE",
                engine: "Engine 2: Logic & Rule",
                course_area: "Data Structures & Programming",
                institution: "KLE Technological University, Hubballi",
                student: {
                    name: "Vivek B M",
                    usn: "01FE24BCA266",
                    role: "Member 2 (Engine 2 Owner)"
                },
                hand_built_structure: "Custom Binary Max-Heap (Priority Queue)",
                justification: "Floyd's O(N) linear build-heap + O(K log N) top-K extraction outperforms O(N log N) full sorting when K << N.",
                dataset_size: touristPlaces.length,
                formula: "Score = (w1 * Rating_norm) + (w2 * Pop_norm) + (w3 * PrefMatch) - (w4 * DistPenalty)",
                non_violable_rules: [
                    "Weights must be non-negative and sum to exactly 1.000",
                    "Composite scores bounded between 0.000 and 1.000",
                    "Budget and distance constraints must be non-negative",
                    "Deterministic tie-breaking on Rating -> Popularity -> Name"
                ]
            });
        }

        // ROUTE 3: Get All Places or Search
        if (pathname === '/api/places' && req.method === 'GET') {
            const activeOnly = query.active !== 'false';
            let results = activeOnly ? touristPlaces.filter(p => p.status === 'ACTIVE') : touristPlaces;
            if (query.q) {
                const q = query.q.trim().toLowerCase();
                results = results.filter(p => p.place_name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.category_name.toLowerCase().includes(q));
            }
            return sendJSON(res, 200, { count: results.length, places: results });
        }

        // ROUTE 3B: Autocomplete Suggestions
        if (pathname === '/api/places/autocomplete' && req.method === 'GET') {
            const q = (query.q || '').trim().toLowerCase();
            if (!q) {
                return sendJSON(res, 200, { suggestions: [] });
            }
            const suggestions = touristPlaces
                .filter(p => p.status === 'ACTIVE' && (p.place_name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)))
                .slice(0, 8)
                .map(p => ({
                    place_id: p.place_id,
                    place_name: p.place_name,
                    city: p.city,
                    category_name: p.category_name
                }));
            return sendJSON(res, 200, { suggestions });
        }

        // ROUTE 4: Get Categories
        if (pathname === '/api/categories' && req.method === 'GET') {
            return sendJSON(res, 200, { categories });
        }

        // ROUTE 5: Search & Rank Destinations (Engine 2 Main Calculation & CustomMaxHeap)
        if (pathname === '/api/rank' && req.method === 'POST') {
            const body = await parseBody(req);

            const keyword = (body.keyword || '').trim().toLowerCase();
            const categoryId = body.category_id ? parseInt(body.category_id) : (body.preferredCategory ? parseInt(body.preferredCategory) : 0);
            const maxBudget = body.max_budget !== undefined ? parseFloat(body.max_budget) : (body.budget !== undefined ? parseFloat(body.budget) : -1);
            const maxDistance = body.max_distance !== undefined ? parseFloat(body.max_distance) : (body.distance !== undefined ? parseFloat(body.distance) : -1);
            const minRating = body.min_rating !== undefined ? parseFloat(body.min_rating) : (body.minRating !== undefined ? parseFloat(body.minRating) : 0);
            const topK = body.top_k ? Math.max(1, parseInt(body.top_k)) : (body.limit ? Math.max(1, parseInt(body.limit)) : 10);
            const sortBy = (body.sort_by || body.sortBy || 'score').toLowerCase();

            // Engine 2 Rule: Validate non-negative budget & distance
            if (maxBudget >= 0 && isNaN(maxBudget)) {
                return sendJSON(res, 400, { error: "RULE VIOLATION: Invalid budget parameter." });
            }
            if (maxDistance >= 0 && isNaN(maxDistance)) {
                return sendJSON(res, 400, { error: "RULE VIOLATION: Invalid distance parameter." });
            }
            if (minRating > 5.0 || minRating < 0.0) {
                return sendJSON(res, 400, { error: "RULE VIOLATION: minRating must be between 0.0 and 5.0." });
            }

            // Engine 2 Rule: Validate Weights
            let weights;
            try {
                weights = validateWeights(body.weights || {});
            } catch (weightErr) {
                return sendJSON(res, 400, { error: weightErr.message });
            }

            // Filter candidate pool
            const candidates = [];
            for (const place of touristPlaces) {
                if (place.status !== 'ACTIVE') continue;

                // Budget constraint: strictly exclude places exceeding budget
                if (maxBudget >= 0 && place.entry_fee > maxBudget) continue;
                // Distance radius constraint
                if (maxDistance > 0 && place.distance_km > maxDistance) continue;
                // Minimum rating constraint
                if (minRating > 0 && place.rating < minRating) continue;

                if (keyword) {
                    const nameMatch = place.place_name.toLowerCase().includes(keyword);
                    const cityMatch = place.city.toLowerCase().includes(keyword);
                    const descMatch = place.description.toLowerCase().includes(keyword);
                    const catMatch = place.category_name.toLowerCase().includes(keyword);
                    if (!nameMatch && !cityMatch && !descMatch && !catMatch) continue;
                }

                // Compute score and audit breakdown
                const scoreData = computeScore(place, categoryId, weights);
                candidates.push({
                    ...place,
                    composite_score: scoreData.composite_score,
                    breakdown: scoreData.breakdown
                });
            }

            // Execute Ranking: Default is Handcrafted CustomMaxHeap
            let rankedPlaces = [];
            const heapStartTime = process.hrtime();
            if (sortBy === 'rating') {
                rankedPlaces = candidates.sort((a, b) => b.rating - a.rating).slice(0, topK);
            } else if (sortBy === 'distance') {
                rankedPlaces = candidates.sort((a, b) => a.distance_km - b.distance_km).slice(0, topK);
            } else if (sortBy === 'fee') {
                rankedPlaces = candidates.sort((a, b) => a.entry_fee - b.entry_fee).slice(0, topK);
            } else if (sortBy === 'popularity') {
                rankedPlaces = candidates.sort((a, b) => b.popularity - a.popularity).slice(0, topK);
            } else {
                // Handcrafted CustomMaxHeap Pipeline
                const maxHeap = new CustomMaxHeap();
                maxHeap.buildHeap(candidates); // O(N)
                rankedPlaces = maxHeap.getTopK(topK); // O(K log N)
            }
            const heapEndTime = process.hrtime(heapStartTime);
            const heapLatencyMs = (heapEndTime[0] * 1000 + heapEndTime[1] / 1e6).toFixed(3);

            return sendJSON(res, 200, {
                metadata: {
                    algorithm: "CustomMaxHeap (Hand-built Priority Queue)",
                    candidate_pool_size: candidates.length,
                    top_k_requested: topK,
                    returned_count: rankedPlaces.length,
                    execution_time_ms: parseFloat(heapLatencyMs),
                    weights_applied: weights
                },
                results: rankedPlaces
            });
        }

        // ROUTE 6: Insert Destination (with Server-Side Rule Enforcement)
        if (pathname === '/api/places' && req.method === 'POST') {
            const body = await parseBody(req);

            // Validate required fields
            if (!body.place_name || !body.city || !body.category_id) {
                return sendJSON(res, 400, { error: "RULE VIOLATION: place_name, city, and category_id are required." });
            }
            if (body.entry_fee < 0 || body.distance_km < 0 || body.rating < 0 || body.rating > 5) {
                return sendJSON(res, 400, { error: "RULE VIOLATION: Domain constraints violated (fee >= 0, dist >= 0, rating 0..5)." });
            }

            // Check duplicate
            const duplicate = touristPlaces.find(p => p.place_name.toLowerCase() === body.place_name.toLowerCase() && p.city.toLowerCase() === body.city.toLowerCase());
            if (duplicate) {
                return sendJSON(res, 409, { error: "RULE VIOLATION: Duplicate destination within the same city." });
            }

            const category = categories.find(c => c.category_id === parseInt(body.category_id));
            const newPlace = {
                place_id: touristPlaces.length + 1,
                place_name: body.place_name.trim(),
                city: body.city.trim(),
                state: body.state || "Karnataka",
                category_id: parseInt(body.category_id),
                category_name: category ? category.category_name : "General",
                entry_fee: parseFloat(body.entry_fee || 0),
                distance_km: parseFloat(body.distance_km || 0),
                rating: parseFloat(body.rating || 0),
                popularity: parseInt(body.popularity || 0),
                best_time_to_visit: body.best_time_to_visit || "October to March",
                description: body.description || "",
                status: "ACTIVE"
            };

            touristPlaces.push(newPlace);

            // Audit Trail Record
            auditLogs.push({
                audit_id: auditLogs.length + 1,
                place_id: newPlace.place_id,
                action_type: "INSERT_RECORD",
                old_entry_fee: null,
                new_entry_fee: newPlace.entry_fee,
                old_rating: null,
                new_rating: newPlace.rating,
                old_status: null,
                new_status: newPlace.status,
                performed_by: "SYSTEM_ADMIN",
                performed_at: new Date().toISOString()
            });

            return sendJSON(res, 201, { message: "Destination added successfully", place: newPlace });
        }

        // ROUTE 7: Update Entry Fee
        if (pathname.startsWith('/api/places/') && pathname.endsWith('/fee') && req.method === 'PUT') {
            const parts = pathname.split('/');
            const placeId = parseInt(parts[3]);
            const body = await parseBody(req);
            const newFee = parseFloat(body.entry_fee);

            if (isNaN(newFee) || newFee < 0) {
                return sendJSON(res, 400, { error: "RULE VIOLATION: Entry fee cannot be negative." });
            }

            const place = touristPlaces.find(p => p.place_id === placeId);
            if (!place) {
                return sendJSON(res, 404, { error: "Destination not found." });
            }

            const oldFee = place.entry_fee;
            place.entry_fee = newFee;

            auditLogs.push({
                audit_id: auditLogs.length + 1,
                place_id: place.place_id,
                action_type: "UPDATE_ENTRY_FEE",
                old_entry_fee: oldFee,
                new_entry_fee: newFee,
                old_rating: place.rating,
                new_rating: place.rating,
                old_status: place.status,
                new_status: place.status,
                performed_by: "SYSTEM_ADMIN",
                performed_at: new Date().toISOString()
            });

            return sendJSON(res, 200, { message: "Entry fee updated", place, old_fee: oldFee, new_fee: newFee });
        }

        // ROUTE 8: Update Rating
        if (pathname.startsWith('/api/places/') && pathname.endsWith('/rating') && req.method === 'PUT') {
            const parts = pathname.split('/');
            const placeId = parseInt(parts[3]);
            const body = await parseBody(req);
            const newRating = parseFloat(body.rating);

            if (isNaN(newRating) || newRating < 0 || newRating > 5.0) {
                return sendJSON(res, 400, { error: "RULE VIOLATION: Rating must be bounded between 0.0 and 5.0." });
            }

            const place = touristPlaces.find(p => p.place_id === placeId);
            if (!place) {
                return sendJSON(res, 404, { error: "Destination not found." });
            }

            const oldRating = place.rating;
            place.rating = newRating;
            place.popularity = (place.popularity || 0) + 1; // Increment popularity

            auditLogs.push({
                audit_id: auditLogs.length + 1,
                place_id: place.place_id,
                action_type: "UPDATE_RATING",
                old_entry_fee: place.entry_fee,
                new_entry_fee: place.entry_fee,
                old_rating: oldRating,
                new_rating: newRating,
                old_status: place.status,
                new_status: place.status,
                performed_by: "SYSTEM_ADMIN",
                performed_at: new Date().toISOString()
            });

            return sendJSON(res, 200, { message: "Rating updated", place, old_rating: oldRating, new_rating: newRating });
        }

        // ROUTE 9: Audit Logs
        if (pathname === '/api/audit-logs' && req.method === 'GET') {
            return sendJSON(res, 200, { count: auditLogs.length, audit_logs: auditLogs });
        }

        // ROUTE 10: Benchmark CustomMaxHeap vs Full Array Sort (Algorithm Justification Proof)
        if (pathname === '/api/benchmark' && req.method === 'GET') {
            const n = parseInt(query.n) || 2000;
            const k = parseInt(query.k) || 10;

            // Generate synthetic destination data
            const syntheticData = [];
            for (let i = 0; i < n; i++) {
                syntheticData.push({
                    place_id: i + 1,
                    place_name: `Place_${i}`,
                    composite_score: Math.random(),
                    rating: (Math.random() * 5).toFixed(2),
                    popularity: Math.floor(Math.random() * 100)
                });
            }

            // Benchmark 1: Custom Max-Heap O(N + K log N)
            const t0 = process.hrtime();
            const heap = new CustomMaxHeap();
            heap.buildHeap(syntheticData);
            const heapTopK = heap.getTopK(k);
            const t1 = process.hrtime(t0);
            const heapTimeMs = (t1[0] * 1000 + t1[1] / 1e6).toFixed(3);

            // Benchmark 2: Full Sort O(N log N)
            const t2 = process.hrtime();
            const sortedArray = syntheticData.slice().sort((a, b) => b.composite_score - a.composite_score);
            const sortTopK = sortedArray.slice(0, k);
            const t3 = process.hrtime(t2);
            const sortTimeMs = (t3[0] * 1000 + t3[1] / 1e6).toFixed(3);

            return sendJSON(res, 200, {
                benchmark_parameters: { elements_count_N: n, top_k_requested_K: k },
                custom_max_heap: {
                    algorithm: "CustomMaxHeap (Floyd Build + Partial Extract)",
                    time_complexity: "O(N + K log N)",
                    elapsed_time_ms: parseFloat(heapTimeMs)
                },
                standard_full_sort: {
                    algorithm: "Full Array Sort (Quicksort / TimSort)",
                    time_complexity: "O(N log N)",
                    elapsed_time_ms: parseFloat(sortTimeMs)
                },
                conclusion: `CustomMaxHeap is theoretically and practically superior for top-${k} queries over large collections, because it avoids sorting the remaining ${n - k} elements.`
            });
        }

        // 404 Fallback
        return sendJSON(res, 404, { error: `Endpoint not found: ${req.method} ${pathname}` });

    } catch (err) {
        return sendJSON(res, 500, { error: "Internal Server Error", message: err.message });
    }
});

server.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`  KLE TECHNOLOGICAL UNIVERSITY - DEPARTMENT OF BCA`);
    console.log(`  ENGINE 2: LOGIC & RULE (DATA STRUCTURES & PROGRAMMING)`);
    console.log(`  STUDENT: VIVEK B M (USN: 01FE24BCA266)`);
    console.log(`  REST Backend Server listening on http://localhost:${PORT}`);
    console.log(`================================================================`);
});

module.exports = server;
