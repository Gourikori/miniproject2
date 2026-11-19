/**
 * Test Suite for Engine 2: Logic & Rule
 * Author: Vivek B M (USN: 01FE24BCA266)
 * Validates:
 * 1. Hand-built CustomMaxHeap correctness (Parent >= Children invariant, Floyd's O(N) build)
 * 2. Top-K extraction order vs ground truth
 * 3. Multi-factor composite scoring formula bounds (0 <= Score <= 1)
 * 4. Non-violable rule enforcement (Weight sum = 1.0, non-negative bounds)
 * 5. Deterministic tie-breaking behavior
 */

const assert = require('assert');

// 1. Test CustomMaxHeap
console.log("======================================================================");
console.log("RUNNING ENGINE 2 LOGIC & ALGORITHM AUTOMATED TEST SUITE");
console.log("======================================================================\n");

class CustomMaxHeap {
    constructor() { this.heap = []; }
    parent(i) { return Math.floor((i - 1) / 2); }
    leftChild(i) { return 2 * i + 1; }
    rightChild(i) { return 2 * i + 2; }

    isGreater(a, b) {
        if (Math.abs(a.composite_score - b.composite_score) > 0.0001) {
            return a.composite_score > b.composite_score;
        }
        if (Math.abs(a.rating - b.rating) > 0.01) {
            return a.rating > b.rating;
        }
        if (a.popularity !== b.popularity) {
            return a.popularity > b.popularity;
        }
        return a.place_name < b.place_name;
    }

    heapifyDown(i) {
        let maxIndex = i;
        const left = this.leftChild(i);
        const right = this.rightChild(i);
        const n = this.heap.length;

        if (left < n && this.isGreater(this.heap[left], this.heap[maxIndex])) maxIndex = left;
        if (right < n && this.isGreater(this.heap[right], this.heap[maxIndex])) maxIndex = right;

        if (i !== maxIndex) {
            const temp = this.heap[i];
            this.heap[i] = this.heap[maxIndex];
            this.heap[maxIndex] = temp;
            this.heapifyDown(maxIndex);
        }
    }

    buildHeap(items) {
        this.heap = items.slice();
        for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
            this.heapifyDown(i);
        }
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
        const res = [];
        const count = Math.min(k, this.heap.length);
        for (let i = 0; i < count; i++) {
            res.push(this.extractMax());
        }
        return res;
    }
}

// TEST 1: Max-Heap Property Invariant
console.log("TEST 1: Verifying Max-Heap Invariant property (Parent >= Children)...");
const testItems = [
    { place_name: "Place A", composite_score: 0.45, rating: 4.1, popularity: 70 },
    { place_name: "Place B", composite_score: 0.89, rating: 4.8, popularity: 95 },
    { place_name: "Place C", composite_score: 0.62, rating: 4.3, popularity: 80 },
    { place_name: "Place D", composite_score: 0.94, rating: 4.9, popularity: 99 },
    { place_name: "Place E", composite_score: 0.71, rating: 4.5, popularity: 88 }
];

const heap = new CustomMaxHeap();
heap.buildHeap(testItems);

// Verify heap property
for (let i = 0; i < Math.floor(heap.heap.length / 2); i++) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < heap.heap.length) {
        assert(heap.isGreater(heap.heap[i], heap.heap[left]) || heap.heap[i].composite_score === heap.heap[left].composite_score, `Heap invariant violated at left child ${left}`);
    }
    if (right < heap.heap.length) {
        assert(heap.isGreater(heap.heap[i], heap.heap[right]) || heap.heap[i].composite_score === heap.heap[right].composite_score, `Heap invariant violated at right child ${right}`);
    }
}
console.log("  [PASS] CustomMaxHeap maintains structural invariant for all parent-child nodes.");

// TEST 2: Top-K Sorted Extraction
console.log("\nTEST 2: Verifying Top-3 Extraction Order...");
const top3 = heap.getTopK(3);
assert.strictEqual(top3[0].place_name, "Place D", "Rank 1 must be Place D (0.94)");
assert.strictEqual(top3[1].place_name, "Place B", "Rank 2 must be Place B (0.89)");
assert.strictEqual(top3[2].place_name, "Place E", "Rank 3 must be Place E (0.71)");
console.log("  [PASS] Top-3 items extracted in strict descending order of composite score.");

// TEST 3: Scoring Formula Calculation & Normalization Bounds
console.log("\nTEST 3: Verifying Formula Normalization Bounds (0 <= Score <= 1.0)...");
function computeScore(rating, popularity, prefMatch, distanceKm, weights) {
    const normRating = Math.max(0, Math.min(1, rating / 5.0));
    const normPop = Math.max(0, Math.min(1, popularity / 100.0));
    const normProximity = 1.0 - Math.max(0, Math.min(1, distanceKm / 500.0));
    const raw = (weights.w1 * normRating) + (weights.w2 * normPop) + (weights.w3 * prefMatch) + (weights.w4 * normProximity);
    return Math.max(0, Math.min(1, raw));
}

const weights = { w1: 0.40, w2: 0.30, w3: 0.20, w4: 0.10 };
const scoreMax = computeScore(5.0, 100, 1.0, 0.0, weights);
const scoreMin = computeScore(0.0, 0, 0.0, 500.0, weights);
const scoreHampi = computeScore(4.9, 99, 1.0, 168.0, weights);

assert(Math.abs(scoreMax - 1.0) < 0.0001, "Perfect place must score 1.0");
assert(Math.abs(scoreMin - 0.0) < 0.0001, "Worst place must score 0.0");
assert(scoreHampi > 0.85 && scoreHampi < 0.98, `Hampi score must be high (~0.955), got ${scoreHampi}`);
console.log(`  [PASS] Score bounds verified. ScoreMax=${scoreMax.toFixed(4)}, ScoreMin=${scoreMin.toFixed(4)}, Hampi=${scoreHampi.toFixed(4)}`);

// TEST 4: Weight Rule Invariant (Gate 1 - B2)
console.log("\nTEST 4: Verifying Non-Violable Weight Invariant Rule (Sum == 1.0, non-negative)...");
function validateWeights(w1, w2, w3, w4) {
    if (w1 < 0 || w2 < 0 || w3 < 0 || w4 < 0) throw new Error("Negative weights prohibited");
    const sum = w1 + w2 + w3 + w4;
    if (Math.abs(sum - 1.0) > 0.001) throw new Error("Weights must sum to 1.0");
    return true;
}

assert.throws(() => validateWeights(-0.1, 0.5, 0.4, 0.2), /Negative weights prohibited/, "Should throw on negative weights");
assert.throws(() => validateWeights(0.5, 0.5, 0.5, 0.5), /Weights must sum to 1.0/, "Should throw on sum != 1.0");
assert.doesNotThrow(() => validateWeights(0.4, 0.3, 0.2, 0.1), "Valid weights must pass");
console.log("  [PASS] Rule violations correctly rejected.");

// TEST 5: Deterministic Tie-Breaking
console.log("\nTEST 5: Verifying Deterministic Tie-Breaking (Same Score, Different Ratings)...");
const tieItems = [
    { place_name: "Place Y", composite_score: 0.750, rating: 4.4, popularity: 80 },
    { place_name: "Place X", composite_score: 0.750, rating: 4.8, popularity: 80 }
];
const tieHeap = new CustomMaxHeap();
tieHeap.buildHeap(tieItems);
const tieWinner = tieHeap.extractMax();
assert.strictEqual(tieWinner.place_name, "Place X", "Place X should win tie due to higher rating");
console.log("  [PASS] Tie-breaking resolved deterministically via visitor rating.");

console.log("\n======================================================================");
console.log("ALL 5 ENGINE 2 TESTS PASSED WITH 100% SUCCESS!");
console.log("======================================================================\n");
