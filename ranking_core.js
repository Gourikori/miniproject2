/**
 * ====================================================================================================
 * Engine 2: Canonical Search & Ranking Algorithm (ranking_core.js)
 * Implements the single canonical ranking calculation, input validation,
 * and handcrafted Binary Max-Heap priority queue for KLE Tech Theme 2/3/4.
 * ====================================================================================================
 */

const MAX_RATING = 5.00;
const MAX_POPULARITY = 100.00;
const MAX_REFERENCE_DISTANCE = 500.00; // Hubballi baseline reference coordinate bound

/**
 * Validates ranking weights (Engine 2 Non-Violable Invariant Rule).
 * Supports both 4-weight model (Rating, Popularity, Preference, Proximity)
 * and 3-weight model (Rating, Popularity, Preference) mapping.
 */
function validateWeights(w = {}) {
    // Map Engine 1 column names or frontend keys
    const wRating = parseFloat(w.wRating ?? w.weight_rating ?? 0.40);
    const wPopularity = parseFloat(w.wPopularity ?? w.weight_popularity ?? 0.30);
    const wPreference = parseFloat(w.wPreference ?? w.weight_preference ?? 0.20);
    const wDistance = parseFloat(w.wDistance ?? w.weight_distance ?? 0.10);

    if (!Number.isFinite(wRating) || !Number.isFinite(wPopularity) || 
        !Number.isFinite(wPreference) || !Number.isFinite(wDistance)) {
        throw new Error("RULE VIOLATION: Weights must be finite numeric values.");
    }

    if (wRating < 0 || wPopularity < 0 || wPreference < 0 || wDistance < 0) {
        throw new Error("RULE VIOLATION (B2): Ranking weights cannot be negative.");
    }

    const sum = wRating + wPopularity + wPreference + wDistance;
    if (Math.abs(sum - 1.000) > 0.005) {
        throw new Error(`RULE VIOLATION (B2): Ranking weights must sum to exactly 1.000 (Current sum = ${sum.toFixed(3)}).`);
    }

    return { wRating, wPopularity, wPreference, wDistance };
}

/**
 * Computes the multi-factor normalized composite score and mathematical proof trace.
 * Guaranteed to produce composite_score strictly bounded in [0.0000, 1.0000].
 */
function computeScore(place, preferredCategoryId, weights) {
    const rawRating = Number.isFinite(place.rating) ? place.rating : 0.0;
    const normRating = Math.max(0.0, Math.min(1.0, rawRating / MAX_RATING));
    const weightedRating = weights.wRating * normRating;

    const rawPop = Number.isFinite(place.popularity) ? place.popularity : 0;
    const normPopularity = Math.max(0.0, Math.min(1.0, rawPop / MAX_POPULARITY));
    const weightedPopularity = weights.wPopularity * normPopularity;

    // preferredCategoryId is an incentive/boost, not a hard exclusion
    const isPrefMatch = (preferredCategoryId && parseInt(preferredCategoryId, 10) === place.category_id);
    const preferenceMatch = isPrefMatch ? 1.0 : 0.0;
    const weightedPreference = weights.wPreference * preferenceMatch;

    const rawDist = Number.isFinite(place.distance_km) ? place.distance_km : 0.0;
    const normProximity = Math.max(0.0, Math.min(1.0, 1.0 - (rawDist / MAX_REFERENCE_DISTANCE)));
    const weightedProximity = weights.wDistance * normProximity;

    const rawScore = weightedRating + weightedPopularity + weightedPreference + weightedProximity;
    const compositeScore = Math.max(0.0, Math.min(1.0, rawScore));

    return {
        composite_score: parseFloat(compositeScore.toFixed(4)),
        breakdown: {
            raw_rating: rawRating,
            norm_rating: parseFloat(normRating.toFixed(4)),
            weighted_rating: parseFloat(weightedRating.toFixed(4)),
            raw_popularity: rawPop,
            norm_popularity: parseFloat(normPopularity.toFixed(4)),
            weighted_popularity: parseFloat(weightedPopularity.toFixed(4)),
            preference_match: preferenceMatch,
            weighted_preference: parseFloat(weightedPreference.toFixed(4)),
            raw_distance_km: rawDist,
            norm_proximity: parseFloat(normProximity.toFixed(4)),
            weighted_proximity: parseFloat(weightedProximity.toFixed(4)),
            formula: `(${weights.wRating} * ${normRating.toFixed(2)}) + (${weights.wPopularity} * ${normPopularity.toFixed(2)}) + (${weights.wPreference} * ${preferenceMatch}) + (${weights.wDistance} * ${normProximity.toFixed(2)})`
        }
    };
}

/**
 * Hand-Built Binary Max-Heap Priority Queue (Engine 2 Core Data Structure)
 * Constructed from first principles without using Array.prototype.sort or external heap libraries.
 * Time Complexity:
 *   - Floyd's buildHeap(): O(N)
 *   - extractMax(): O(log N)
 *   - getTopK(): O(K log N)
 *   - Total Top-K Time: O(N + K log N) vs O(N log N) for full sort.
 */
class CustomMaxHeap {
    constructor() {
        this.heap = [];
    }

    parent(i) { return Math.floor((i - 1) / 2); }
    leftChild(i) { return 2 * i + 1; }
    rightChild(i) { return 2 * i + 2; }

    // Deterministic tie-breaking comparator (Score -> Rating -> Popularity -> Name)
    isGreater(a, b) {
        if (Math.abs(a.composite_score - b.composite_score) > 0.0001) {
            return a.composite_score > b.composite_score;
        }
        // Tie-breaker 1: Visitor Rating
        if (Math.abs(a.rating - b.rating) > 0.01) {
            return a.rating > b.rating;
        }
        // Tie-breaker 2: Popularity
        if (a.popularity !== b.popularity) {
            return a.popularity > b.popularity;
        }
        // Tie-breaker 3: Alphabetical by Place Name
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

    // Floyd's O(N) bottom-up heap construction
    buildHeap(items) {
        this.heap = items.slice();
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

/**
 * Strict numeric input validation helper.
 * Rejects non-finite, NaN, and malformed numeric inputs.
 */
function validateNumericParam(value, fieldName, defaultValue, { allowNegativeOne = false, min = 0, max = Infinity } = {}) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    const num = Number(value);
    if (!Number.isFinite(num)) {
        throw new Error(`VALIDATION ERROR: Field '${fieldName}' must be a valid finite number.`);
    }
    if (allowNegativeOne && num === -1) {
        return -1;
    }
    if (num < min || num > max) {
        throw new Error(`VALIDATION ERROR: Field '${fieldName}' must be between ${min} and ${max}.`);
    }
    return num;
}

/**
 * Core Ranking & Filter Execution Pipeline.
 * Interprets category_id as preferredCategory.
 * max_budget: -1 means no limit, max_budget: 0 means free places only.
 * max_distance: -1 means no limit.
 */
function executeSearchAndRank(catalog, queryParams = {}, activeWeights = null) {
    const rawKeyword = queryParams.keyword !== undefined ? String(queryParams.keyword).trim() : '';
    const preferredCategoryId = validateNumericParam(
        queryParams.category_id ?? queryParams.preferredCategory,
        'category_id',
        0,
        { min: 0 }
    );
    const maxBudget = validateNumericParam(
        queryParams.max_budget ?? queryParams.budget,
        'max_budget',
        -1,
        { allowNegativeOne: true, min: 0 }
    );
    const maxDistance = validateNumericParam(
        queryParams.max_distance ?? queryParams.distance,
        'max_distance',
        -1,
        { allowNegativeOne: true, min: 0 }
    );
    const minRating = validateNumericParam(
        queryParams.min_rating ?? queryParams.minRating,
        'min_rating',
        0,
        { min: 0, max: 5.0 }
    );
    const topK = validateNumericParam(
        queryParams.top_k ?? queryParams.limit,
        'top_k',
        10,
        { min: 1, max: 1000 }
    );

    const validSortModes = ['score', 'rating', 'distance', 'fee', 'popularity'];
    const sortBy = String(queryParams.sort_by ?? queryParams.sortBy ?? 'score').toLowerCase();
    if (!validSortModes.includes(sortBy)) {
        throw new Error(`VALIDATION ERROR: Invalid sort_by '${sortBy}'. Must be one of: ${validSortModes.join(', ')}`);
    }

    const weights = validateWeights(activeWeights || queryParams.weights || {});

    // Step 1: Filter candidate pool
    const candidates = [];
    const kw = rawKeyword.toLowerCase();

    for (const place of catalog) {
        if (place.status && place.status !== 'ACTIVE') continue;

        // Budget filtering rule:
        // -1 = no limit
        // 0 = free places only (entry_fee <= 0)
        // > 0 = entry_fee <= maxBudget
        if (maxBudget === 0 && place.entry_fee > 0.00) continue;
        if (maxBudget > 0 && place.entry_fee > maxBudget) continue;

        // Distance filtering rule: -1 = no limit
        if (maxDistance > 0 && place.distance_km > maxDistance) continue;

        // Rating threshold
        if (minRating > 0 && place.rating < minRating) continue;

        // Keyword search (place_name, city, category_name, description)
        if (kw) {
            const nameMatch = place.place_name ? place.place_name.toLowerCase().includes(kw) : false;
            const cityMatch = place.city ? place.city.toLowerCase().includes(kw) : false;
            const catMatch = place.category_name ? place.category_name.toLowerCase().includes(kw) : false;
            const descMatch = place.description ? place.description.toLowerCase().includes(kw) : false;
            if (!nameMatch && !cityMatch && !catMatch && !descMatch) continue;
        }

        // Score computation (preferred category applies preference boost)
        const scoreData = computeScore(place, preferredCategoryId, weights);
        candidates.push({
            ...place,
            composite_score: scoreData.composite_score,
            breakdown: scoreData.breakdown
        });
    }

    // Step 2: Ranking execution
    let rankedPlaces = [];
    const startTime = process.hrtime();

    if (sortBy === 'rating') {
        rankedPlaces = candidates.sort((a, b) => b.rating - a.rating || b.composite_score - a.composite_score).slice(0, topK);
    } else if (sortBy === 'distance') {
        rankedPlaces = candidates.sort((a, b) => a.distance_km - b.distance_km || b.composite_score - a.composite_score).slice(0, topK);
    } else if (sortBy === 'fee') {
        rankedPlaces = candidates.sort((a, b) => a.entry_fee - b.entry_fee || b.composite_score - a.composite_score).slice(0, topK);
    } else if (sortBy === 'popularity') {
        rankedPlaces = candidates.sort((a, b) => b.popularity - a.popularity || b.composite_score - a.composite_score).slice(0, topK);
    } else {
        // Default: Hand-built CustomMaxHeap priority queue
        const maxHeap = new CustomMaxHeap();
        maxHeap.buildHeap(candidates); // Floyd's O(N) build
        rankedPlaces = maxHeap.getTopK(topK); // O(K log N)
    }

    const endTime = process.hrtime(startTime);
    const latencyMs = parseFloat(((endTime[0] * 1000) + (endTime[1] / 1e6)).toFixed(3));

    return {
        metadata: {
            algorithm: sortBy === 'score' ? "CustomMaxHeap (Hand-built Priority Queue)" : `StandardSort (${sortBy})`,
            candidate_pool_size: candidates.length,
            top_k_requested: topK,
            returned_count: rankedPlaces.length,
            execution_time_ms: latencyMs,
            weights_applied: weights
        },
        results: rankedPlaces
    };
}

module.exports = {
    validateWeights,
    computeScore,
    CustomMaxHeap,
    validateNumericParam,
    executeSearchAndRank,
    MAX_RATING,
    MAX_POPULARITY,
    MAX_REFERENCE_DISTANCE
};
