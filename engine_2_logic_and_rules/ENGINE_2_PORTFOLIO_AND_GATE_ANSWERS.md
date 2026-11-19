# KLE TECHNOLOGICAL UNIVERSITY
## School of Computer Science & Engineering
### Course Project / Capstone Evaluation
### Theme: Search and Ranking System
### Project Title: Tourist Place Search and Ranking System

---

# ENGINE 2: LOGIC & RULE (Data Structures & Programming)
**Owner / Role:** Member 2  
**Faculty Mentors:** Prof. Pavan Vadavi, Prof. Sayeda Anjum  
**Department / Division:** Division E  

---

## 1. Engine 2 Identity & Ownership Statement

> *"The main calculation or rule. One structure or algorithm built by hand, with a reason for choosing it."*

As **Member 2**, I own **Engine 2 (Logic & Rule)**. My sole responsibility is to formulate, prove, and implement the core computational logic, the multi-criteria ranking algorithm, and the hand-crafted data structures without relying on built-in sorting libraries or black-box priority queues.

---

## 2. Hand-Built Data Structures & Reason for Choosing

Engine 2 features **two custom data structures built completely from scratch** (no `heapq`, no `std::priority_queue`, no external search libraries):

### Primary Structure 1: Bounded Min-Heap for Top-$K$ Ranking (`TopKHeap`)
* **What it is:** A complete binary tree stored in a dynamic array where each parent node is smaller than or equal to its children:
  $$\text{Parent}(i) = \lfloor (i - 1) / 2 \rfloor, \quad \text{Left}(i) = 2i + 1, \quad \text{Right}(i) = 2i + 2$$
* **Reason for Choosing It (Viva Defense):**
  1. **Time Complexity:** Standard sorting of $N$ candidates takes $O(N \log N)$ time. By maintaining a bounded min-heap of size $K$, processing $N$ candidates takes only **$O(N \log K)$** time.
  2. **Space Complexity:** A full sort requires holding all $N$ elements in memory ($O(N)$ space). The bounded min-heap requires only **$O(K)$** auxiliary space.
  3. **Why a Min-Heap for Top-Highest elements?** The root always holds the *minimum* score among the current top $K$. When a new place has a score strictly greater than the root, we replace the root and sift down in $O(\log K)$. If it is lower, it is discarded in $O(1)$.
  4. **Empirical Justification:** When $N = 100,000$ and $K = 10$, $\log_2(10) \approx 3.3$ vs $\log_2(100,000) \approx 16.6$. This yields an algorithmic speedup of over **$5\times$ to $8\times$** in real-time execution.

### Primary Structure 2: Prefix Trie for Autocomplete & Search (`Trie`)
* **What it is:** A multi-way search tree where every edge represents an incoming character and nodes store matching tourist place IDs.
* **Reason for Choosing It (Viva Defense):**
  1. **Search Complexity:** Searching a prefix of length $L$ takes **$O(L)$** time, strictly independent of the database size $N$. A linear scan or SQL `LIKE '%prefix%'` requires $O(N \times L)$ table scans.
  2. **Prefix Sharing:** Tourist spot names (e.g., "Badami Cave", "Badami Fort", "Bangalore Palace") share common roots, drastically reducing memory redundancy.
  3. **Real-time Keystroke Autocomplete:** As the tourist types characters in Engine 3's web UI, matching suggestions are returned within $<2\text{ ms}$.

---

## 3. The Main Calculation & Rule: Multi-Criteria Ranking Formula

The ranking score $S(P, U)$ for place $P$ under user context $U$ is a composite score bounded strictly in $[0.0, 100.0]$:

$$S(P, U) = w_r \cdot S_{\text{rating}} + w_d \cdot S_{\text{distance}} + w_b \cdot S_{\text{budget}} + w_s \cdot S_{\text{season}} + w_p \cdot S_{\text{popularity}}$$

Where default weights satisfy $\sum w_i = 1.0$:
- $w_r = 0.35$ (Rating quality & credibility)
- $w_d = 0.25$ (Geographic proximity)
- $w_b = 0.15$ (Budget compatibility)
- $w_s = 0.15$ (Seasonal suitability)
- $w_p = 0.10$ (Popularity tier / fame)

### Sub-Score Mathematical Rules:

#### 1. Bayesian Credibility Rating Sub-score ($S_{\text{rating}}$):
To avoid the "1 review with 5.0 stars ranks higher than 10,000 reviews with 4.8 stars" flaw, we use the Bayesian prior formula:
$$WR = \left(\frac{v}{v + m}\right) \cdot R + \left(\frac{m}{v + m}\right) \cdot C$$
- $v$: Place review count.
- $m$: Confidence threshold (set to $25$ reviews).
- $R$: Average user rating ($1.0$ to $5.0$).
- $C$: Global prior average rating (set to $3.5$).
$$S_{\text{rating}} = \left(\frac{WR - 1.0}{4.0}\right) \times 100.0$$

#### 2. Haversine Distance & Exponential Decay Sub-score ($S_{\text{distance}}$):
Great-circle distance $d$ in kilometers calculated via the Haversine formula:
$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$d = 2 R \cdot \text{atan2}(\sqrt{a}, \sqrt{1 - a}), \quad (R = 6371\text{ km})$$
Proximity decay uses an exponential half-life curve ($d_0 = 50\text{ km}$):
$$S_{\text{distance}} = 100 \cdot e^{-d / d_0}$$
*Guarantees zero division errors and smooth decay without artificial hard cutoffs.*

#### 3. Budget Compatibility Sub-score ($S_{\text{budget}}$):
$$\text{Ratio} = \frac{\text{Entry Fee}}{\text{User Budget}}$$
- If $\text{Entry Fee} = 0$ (Free entry): $S_{\text{budget}} = 100.0$.
- If $\text{Ratio} \le 0.5$: $S_{\text{budget}} = 95.0$.
- If $0.5 < \text{Ratio} \le 1.0$: $S_{\text{budget}} = 80 - (\text{Ratio} - 0.5) \times 40$.
- If $1.0 < \text{Ratio} \le 1.5$: $S_{\text{budget}} = \max(10.0, 50 - (\text{Ratio} - 1.0) \times 80)$.
- If $\text{Ratio} > 1.5$: $S_{\text{budget}} = 5.0$.

#### 4. Seasonality Sub-score ($S_{\text{season}}$):
- Exact match or recommended season is "All": $100.0$.
- Adjacent/transitional season: $60.0$.
- Off-season: $30.0$.

#### 5. Popularity Tier Sub-score ($S_{\text{popularity}}$):
$$\text{Tier} \in [1, 5] \implies S_{\text{popularity}} = \text{Tier} \times 20.0$$

---

## 4. GATE 0: Problem Approval Sheet (Evidence & Answers)

| # | Evidence to be Produced | Engine 2 Specific Evidence & Location |
|---|---|---|
| **A1** | Problem statement with stakeholders named | **Stakeholders:** Tourists (receive irrelevant/unranked search results, cold-start bias, misleading 5-star ratings with 1 review), Tourism Dept (hidden gems unranked). **Problem:** Lack of multi-criteria ranking leads to manual filtering exhaustion and sub-optimal itineraries. |
| **A2** | AS-IS and TO-BE workflows | **AS-IS:** Tourist executes unweighted SQL query `SELECT * FROM places WHERE city='X'` $\rightarrow$ Static alphabetical/raw star rating order $\rightarrow$ User manually cross-checks distance on Maps and prices on blogs.<br>**TO-BE:** User enters query + optional GPS/budget $\rightarrow$ Engine 2 Trie instant prefix retrieval $\rightarrow$ ScoringRule computes multi-factor score $\rightarrow$ Hand-built Top-K Min-Heap returns ranked Top-10 places in $<10\text{ ms}$. |
| **A3** | Scope and out-of-scope list; feasibility and risk | **In-Scope (Engine 2):** In-memory Trie index, bounded Top-K Heap, Bayesian smoothing, Haversine distance decay, budget/season scoring, JSON ranking response.<br>**Out-of-Scope:** Real-time turn-by-turn road traffic navigation (delegated to Google Maps), relational table storage (Engine 1), HTML/CSS rendering (Engine 3).<br>**Risk:** High memory usage if all places duplicated in Trie. **Mitigation:** Trie stores only integer `place_id` pointers (4 bytes). |
| **A4** | Integration Map v1 | **Engine 1 (DBMS)** $\rightarrow$ Supplies raw records via `sync_from_database()`.<br>**Engine 2 (Logic)** $\rightarrow$ Builds Trie + scores + extracts Top-$K$.<br>**Engine 3 (Web)** $\rightarrow$ Calls `handle_search_request()` via REST API.<br>**Engine 4 (Testing)** $\rightarrow$ Executes unit tests (`test_engine_2.py`) and empirical benchmarks. |
| **B1** | What currently cannot be proved (Disputed item / Mismatch) | **Disputed Mismatch:** A tourist destination with a single 5.0-star review from the owner's friend currently ranks higher than a UNESCO world heritage site with 15,000 reviews averaging 4.8. Under raw SQL sorting, the authenticity and confidence level of ratings cannot be mathematically proved or defended. Engine 2 solves this via Bayesian prior evidence. |

* **Student's own statement (Weakest point in Gate 0):** Tuning the constant weights ($w_r, w_d, w_b, w_s, w_p$) to ensure no single dimension inadvertently eclipses another across diverse tourist profiles.
* **Faculty question asked at Decision level:** *"Why not just do `ORDER BY rating DESC, distance ASC` in SQL?"*
  * **Answer:** SQL cannot compute non-linear exponential distance decay, cannot compute Bayesian prior adjustments per row dynamically without severe query latency, and forces a sequential lexicographical sort rather than a balanced multi-criteria trade-off.

---

## 5. GATE 1: Requirements Baseline Sheet (Evidence & Answers)

### Functional Requirements (Engine 2 Specific)
* **FR-E2-01 (Prefix Search):** The engine shall index tourist names, cities, categories, and tags in a hand-crafted Trie and return matching `place_id` sets in $O(L)$ time.
* **FR-E2-02 (Multi-Criteria Scoring):** The system shall calculate composite scores for all candidate places using Bayesian rating, Haversine distance decay, budget ratio, and season factors.
* **FR-E2-03 (Top-$K$ Heap Extraction):** The engine shall use a custom hand-built Min-Heap of capacity $K$ to extract the Top-$K$ highest-scoring places in $O(N \log K)$ time.
* **FR-E2-04 (Tie-Breaking Rule):** In case of identical composite scores up to 2 decimal places, the engine shall break ties deterministically by higher review count, followed by lower `place_id`.
* **FR-E2-05 (Autocompletion):** The engine shall provide real-time autocomplete suggestions (max 8) for any input prefix of length $\ge 1$.
* **FR-E2-06 (Granular Breakdown):** The engine shall return not just the final score, but the individual component sub-scores (`bayesian_rating`, `distance`, `budget`, `season`, `popularity`) for transparent auditing.

### Non-Functional Requirements (Measurable)
* **NFR-E2-01 (Latency):** Ranking $N = 10,000$ tourist places for Top-$K = 10$ must execute in under **$15\text{ ms}$** on standard college lab hardware.
* **NFR-E2-02 (Memory Overhead):** The Top-K Heap auxiliary memory shall not exceed **$O(K)$** nodes at any instant during traversal.
* **NFR-E2-03 (Numeric Stability):** All scoring calculations must be strictly bounded in $[0.00, 100.00]$ without `NaN`, `Infinity`, or divide-by-zero exceptions under any input combination.

### Theme-Specific Evidence (Gate 1)
* **B1 (Scoring Effect on Balance/Score):**
  - High review count with high rating: Increases score towards $100$.
  - Distance $> 100\text{ km}$: Decays distance sub-score exponentially from $100$ down towards $13.5$.
  - Entry fee $> \text{Budget}$: Applies steep penalty reducing budget sub-score to $\le 10$.
  - Off-season: Caps season score at $30.0$.
* **B2 (Rules That Must Never Be Violated):**
  1. **Strict Bounds Invariant:** $\forall P, U: 0.0 \le S(P, U) \le 100.0$.
  2. **Non-Negative Distance Invariant:** Haversine output must always be $\ge 0.0\text{ km}$.
  3. **Zero-Review Integrity:** Review count of zero must never trigger divide-by-zero; it must evaluate to the global prior mean rating ($3.5$).
  4. **Heap Boundedness Invariant:** $\text{Heap.size}() \le K$ at all times during the streaming ranking phase.
* **B3 (Acceptance Criterion for Audit Trail):**
  - Every ranked item returned to Engine 3 must include a deterministic audit payload:
    ```json
    {
      "rank": 1,
      "place_id": 1,
      "name": "Hampi Heritage Ruins",
      "composite_score": 88.42,
      "score_breakdown": {
        "bayesian_rating": 94.85,
        "distance": 45.20,
        "budget": 95.00,
        "season": 100.00,
        "popularity": 100.00
      }
    }
    ```
  - Any evaluator can independently verify the final score by calculating:
    $$\sum (\text{weight}_i \times \text{sub-score}_i) = \text{composite\_score} \pm 0.01$$

---

## 6. Faculty Viva Defense Q&A (KLE Tech Decision Level)

1. **Q: Why did you write your own Min-Heap instead of using Python's `heapq` or C++ `std::priority_queue`?**
   * **A:** As per Engine 2 guidelines, core data structures must be built *by hand* to demonstrate mastery of internal array-based binary trees, sift-up ($O(\log K)$), sift-down ($O(\log K)$), and pointer/index manipulation. Using library functions hides the underlying mechanics and loses marks.

2. **Q: Why do you use a Min-Heap to find the Top-K HIGHEST elements instead of a Max-Heap?**
   * **A:** With a Min-Heap of size $K$, the root is always the *smallest* among the top $K$ candidates found so far. When comparing a new item, we only need to check if it is greater than the root ($O(1)$). If it is, we replace the root and sift down ($O(\log K)$). If we used a Max-Heap of size $K$, the root would be the largest element, so we would not know whether a new candidate beats the *smallest* of our top candidates without searching the leaves.

3. **Q: What happens if two places have the exact same score?**
   * **A:** We have an explicit secondary and tertiary tie-breaking rule implemented in `HeapNode.__lt__`: it compares `review_count` (higher credibility wins), and if still tied, compares `place_id` (deterministic consistency).

4. **Q: How does Engine 2 prevent bad data if Engine 1 or Engine 3 sends invalid coordinates or negative budgets?**
   * **A:** Engine 2 implements defensive input clamping in `ScoringRule`: latitude is clamped to $[-90, 90]$, longitude to $[-180, 180]$, budget $\le 0$ falls back to neutral baseline or free-entry logic, and review counts $< 0$ are clamped to $0$.

---

## 7. Deliverable File Summary

| File Path | Description |
|---|---|
| `ranking_engine.py` | Complete production implementation of `TouristPlace`, `ScoringRule`, `TopKHeap` (hand-built), `Trie` (hand-built), and `SearchAndRankingEngine`. |
| `demo_and_benchmark.py` | Live demonstration script with sample destinations & empirical $O(N \log K)$ vs $O(N \log N)$ benchmark. |
| `test_engine_2.py` | Formal unit test suite covering bounds, invariants, tie-breaking, and heap operations. |
| `api_contract.py` | Inter-engine service contract connecting Engine 1 (Database) and Engine 3 (Web API). |
| `ENGINE_2_PORTFOLIO_AND_GATE_ANSWERS.md` | Complete academic report and Gate 0 / Gate 1 submission sheet answers. |
