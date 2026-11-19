# ENGINE 2: LOGIC & RULE — ALGORITHMIC SPECIFICATION & DESIGN
**Tourist Place Search and Ranking System**  
**Department of Bachelor of Computer Applications, KLE Technological University, Hubballi**  
**Student:** Vivek B M (USN: `01FE24BCA266`)  
**Course Area:** Data Structures & Programming (DSA)  
**Faculty Guides:** Prof. Pavankumar Vadavi, Prof. Sayeeda Anjum  

---

## 1. Executive Summary & Engine 2 Responsibility

Under the **Four Engines, Four Members** pedagogical model of KLE Technological University:
- **Engine 1 (Data & Integrity):** Shrilakshmi G.S — DBMS, schema modeling, domain CHECK constraints, audit triggers.
- **Engine 2 (Logic & Rule):** Vivek B M — Data Structures & Programming, core calculations, handcrafted data structures, ranking algorithms, and backend API logic.
- **Engine 3 (Interface & Access):** Gouri K — Web Technologies, client views, filter controls, responsive card presentation.
- **Engine 4 (Testing & Validation):** Team 02 — Software Engineering, RTM, defect tracking, automated test suites.

Engine 2 is solely evaluated on:
1. **The Main Calculation / Rule:** Mathematical formulation of the multi-factor ranking score with non-violable weight invariants ($\sum w_i = 1.0$).
2. **One Hand-Built Data Structure:** Custom Binary Max-Heap (`CustomMaxHeap`) implemented from fundamental array memory without relying on `std::sort`, `std::priority_queue`, or `Array.prototype.sort`.
3. **Formal Justification:** Mathematical and asymptotic proof demonstrating why a Max-Heap is superior to full array sorting for Top-$K$ recommendation systems.

---

## 2. The Main Calculation & Formula

### 2.1 Attribute Normalization
To prevent attributes with larger numerical ranges (such as distance or popularity) from dominating attributes with smaller ranges (such as ratings between 0 and 5), Engine 2 projects each dimension onto the bounded continuous interval $[0.000, 1.000]$:

1. **Normalized Rating ($\text{NormRating}$):**
   $$\text{NormRating}(P) = \frac{\text{Rating}(P)}{\text{MAX\_RATING}} = \frac{\text{Rating}(P)}{5.00} \in [0.0, 1.0]$$

2. **Normalized Popularity ($\text{NormPopularity}$):**
   $$\text{NormPopularity}(P) = \frac{\text{Popularity}(P)}{\text{MAX\_POPULARITY}} = \frac{\text{Popularity}(P)}{100.00} \in [0.0, 1.0]$$

3. **Preference Match Indicator ($\text{PrefMatch}$):**
   $$\text{PrefMatch}(P, C_{\text{target}}) = \begin{cases} 1.000, & \text{if } \text{CategoryID}(P) = C_{\text{target}} \\ 0.000, & \text{otherwise} \end{cases}$$

4. **Normalized Proximity ($\text{NormProximity}$):**
   Using Hubballi (KLE Tech campus) as the central regional coordinate baseline:
   $$\text{NormProximity}(P) = \max\left(0.0, 1.0 - \frac{\text{DistanceKm}(P)}{\text{MAX\_DISTANCE}}\right) = 1.0 - \frac{\min(\text{DistanceKm}(P), 500.0)}{500.0} \in [0.0, 1.0]$$
   *(Nearer destinations score close to 1.0; destinations at or beyond 500 km score 0.0).*

---

### 2.2 Composite Scoring Formula (Linear Convex Combination)
Given normalized features and user-configured weights $(w_1, w_2, w_3, w_4)$:

$$\text{CompositeScore}(P) = w_1 \cdot \text{NormRating}(P) + w_2 \cdot \text{NormPopularity}(P) + w_3 \cdot \text{PrefMatch}(P) + w_4 \cdot \text{NormProximity}(P)$$

### 2.3 Non-Violable Weight Invariant Rule (Gate 1 - B2)
$$\sum_{i=1}^{4} w_i = w_1 + w_2 + w_3 + w_4 = 1.000 \pm 0.005, \quad \text{where } w_i \ge 0.000 \quad (\forall i)$$

**Mathematical Proof of Boundedness:**
Because $\text{NormRating}, \text{NormPopularity}, \text{PrefMatch}, \text{NormProximity} \in [0.0, 1.0]$ and $\sum w_i = 1.0$ with $w_i \ge 0$:
$$\text{CompositeScore}_{\min} = \sum w_i \cdot 0.0 = 0.000$$
$$\text{CompositeScore}_{\max} = \sum w_i \cdot 1.0 = 1.000$$
$$\therefore \quad 0.000 \le \text{CompositeScore}(P) \le 1.000 \quad (\forall P)$$
The final score is mathematically guaranteed never to exceed 1.0 or become negative.

---

## 3. Handcrafted Data Structure: Custom Binary Max-Heap

### 3.1 Structural Properties
The `CustomMaxHeap` is implemented using a sequential dynamic memory array where elements satisfy the **Complete Binary Tree** and **Max-Heap Property**:
- **Parent Index:** $\text{parent}(i) = \lfloor (i - 1) / 2 \rfloor$
- **Left Child Index:** $\text{left}(i) = 2i + 1$
- **Right Child Index:** $\text{right}(i) = 2i + 2$
- **Max-Heap Invariant:** For every non-root index $i > 0$:
  $$\text{CompositeScore}(\text{Heap}[\text{parent}(i)]) \ge \text{CompositeScore}(\text{Heap}[i])$$

```
                    Root: Rank #1
                 [Vijaya Vittala (0.755)]
                 /                      \
      [Virupaksha (0.753)]      [Dandeli (0.735)]
         /            \             /           \
 [Sirsi (0.730)] [Pattadakal(0.728)] [Badami] [Jog Falls]
```

### 3.2 Floyd's $O(N)$ Bottom-Up Heap Construction
Rather than repeatedly inserting $N$ items into an empty heap (which takes $O(N \log N)$ time), our handcrafted implementation uses **Floyd’s algorithm**:
1. Copy all candidate destinations into the heap array.
2. Iterate backwards from the last non-leaf node index $i = \lfloor (N / 2) \rfloor - 1$ down to root $i = 0$.
3. Invoke `heapifyDown(i)` at each step.

**Time Complexity Proof:**
Let height of tree be $h = \lfloor \log_2 N \rfloor$. The maximum number of nodes at height $k$ is $\lceil N / 2^{k+1} \rceil$, and `heapifyDown()` takes $O(k)$ swaps:
$$T(N) = \sum_{k=0}^{\lfloor \log N \rfloor} \left\lceil \frac{N}{2^{k+1}} \right\rceil O(k) = O\left(N \sum_{k=0}^{\infty} \frac{k}{2^k}\right) = O(N \cdot 2) = O(N)$$
Thus, the candidate pool is organized into a valid max-heap in linear $O(N)$ time.

---

### 3.3 Top-$K$ Priority Extraction in $O(K \log N)$
To retrieve the Top-$K$ recommendations:
1. Root item `Heap[0]` (the maximal element) is extracted: $O(1)$.
2. The last element `Heap.back()` is moved to `Heap[0]`.
3. `heapifyDown(0)` restores heap ordering: $O(\log N)$.
4. Repeat $K$ times.

**Total Pipeline Time:**
$$T_{\text{Total}}(N, K) = O(N) + O(K \log N) = O(N + K \log N)$$

---

## 4. Reason for Choosing Max-Heap Over Quicksort / Mergesort

| Feature / Algorithm | Quicksort / Mergesort (Full Sort) | Hand-Built Custom Max-Heap | Advantage of Engine 2 Choice |
| :--- | :--- | :--- | :--- |
| **Primary Goal** | Completely sorts all $N$ elements | Extracts only the top $K$ items | Matches user behavior ($K=5$ or $10$) |
| **Initial Build Time** | $O(N \log N)$ | **$O(N)$ (Floyd's algorithm)** | Faster candidate pool initialization |
| **Top-$K$ Extraction Time**| $O(1)$ after full sort | **$O(K \log N)$** | Asymptotically optimal when $K \ll N$ |
| **Total Query Time** | $O(N \log N)$ | **$O(N + K \log N)$** | For $N=1000, K=10$: $9965$ ops vs $1099$ ops ($\approx 9\times$ faster) |
| **Auxiliary Memory** | $O(N)$ (MergeSort) or $O(\log N)$ stack | **$O(1)$ in-place swaps** | Zero extra buffer allocation |
| **Dynamic Updates** | Must re-sort all $N$ elements: $O(N \log N)$ | **Insert / update in $O(\log N)$** | Real-time synchronization with Engine 1 triggers |

---

## 5. Deterministic Tie-Breaking (Gate 1 - B2 & B3)

When two destinations produce mathematically identical composite scores within tolerance $\epsilon = 0.0001$:
1. **Primary Key:** `composite_score` (Descending)
2. **Secondary Tie-Breaker:** `rating` (Descending) — The place with higher visitor feedback prevails.
3. **Tertiary Tie-Breaker:** `popularity` (Descending) — The place with greater visitor volume prevails.
4. **Quaternary Tie-Breaker:** `place_name` (Ascending) — Lexicographical order guarantees 100% deterministic, non-oscillating rankings across repeated queries.

---

## 6. Verification and Automated Test Results

The automated test script `test_engine2.js` and standalone executable `engine2_ranking.cpp` confirm:
1. **Test 1 (Heap Property Invariant):** Verified that `Heap[i] >= Heap[left]` and `Heap[i] >= Heap[right]` for all non-leaf nodes.
2. **Test 2 (Top-K Extraction Order):** Verified Top-3 items returned in strict descending score order.
3. **Test 3 (Formula Normalization Bounds):** Verified $\text{Score}_{\max} = 1.0000$, $\text{Score}_{\min} = 0.0000$, and Vijaya Vittala at Hampi evaluates to $0.7554$.
4. **Test 4 (Rule Violation Rejection):** Verified that weights summing to $1.200$ and negative weights ($-0.10$) are immediately caught and rejected.
5. **Test 5 (Deterministic Tie-Breaking):** Verified that places sharing equal scores are ordered deterministically by visitor rating.
