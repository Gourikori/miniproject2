# Tourist Place Search and Ranking System

**Department:** Bachelor of Computer Applications, KLE Technological University, Hubballi  
**Themes:** Theme 3 — Search and Ranking System / Theme 4 — Reporting and MIS System  
**Faculty Guides:** Prof. Pavankumar Vadavi, Prof. Sayeeda Anjum  
**Division:** E | **Team:** Team 02  

---

## 1. Team & Engine Architecture Mapping

| Engine | Technical Focus Area | Team Member | USN | Core Deliverable |
| :--- | :--- | :--- | :--- | :--- |
| **Engine 1** | **Data & Integrity** | **Shrilakshmi G.S** | `01FE24BCA314` | MySQL relational schema, CHECK constraints, audit triggers, 34 Karnataka records, MIS views |
| **Engine 2** | **Logic & Rule** | **Vivek B M** | `01FE24BCA266` | Hand-built `CustomMaxHeap` Priority Queue, Multi-factor Composite Scoring Algorithm, REST Backend Server |
| **Engine 3** | **Interface & Access** | **Gouri K** | `01FE24BCA312` | Web UI, responsive filter controls, REST client presentation |
| **Engine 4** | **Testing & Validation**| **Team 02** | — | Requirements Traceability Matrix (RTM), test suites, defect log |

---

## 2. Engine 2: Logic & Rule Deliverables (Member 2 — Vivek B M)

### 2.1 Core Deliverables
1. **The Main Calculation / Rule:**
   - Multi-factor Composite Scoring Formula:
     $$\text{CompositeScore}(P) = w_1 \cdot \text{NormRating}(P) + w_2 \cdot \text{NormPopularity}(P) + w_3 \cdot \text{PrefMatch}(P) + w_4 \cdot \text{NormProximity}(P)$$
   - Weight Invariant Validation Rule: $\sum_{i=1}^4 w_i = 1.000$ and $w_i \ge 0$.
   - Strict score bounds: $0.000 \le \text{Score} \le 1.000$.

2. **One Hand-Built Data Structure:**
   - `CustomMaxHeap`: Complete binary max-heap built from fundamental array memory without using `std::sort`, `std::priority_queue`, or `Array.prototype.sort`.
   - **Reason for Choosing Max-Heap:** Floyd's linear $O(N)$ heap build + $O(K \log N)$ Top-$K$ extraction vs $O(N \log N)$ full array sort. When $K \ll N$ (e.g. top 5 or 10 recommendations), Max-Heap is asymptotically optimal.

3. **Backend Server & REST API:**
   - Node.js backend (`server.js`) and Python script (`engine2_backend.py`) implementing the exact same logic, formula, and REST endpoints for Engine 3 and Engine 4.
   - Built-in interactive web testing console at `http://localhost:5000`.

---

## 3. Repository Structure

```
├── README.md
│
├── [ENGINE 1 - DATA & INTEGRITY]
│   ├── gate_0_database.sql                            # Gate 0 prototype SQL script (12 destinations)
│   ├── database_queries.sql                           # Gate 1 master SQL script (34 destinations + Audit triggers)
│   ├── GATE_00_EVIDENCE_ENGINE1.md                    # Gate 0 evaluation evidence matrix (Shrilakshmi)
│   ├── GATE_01_EVIDENCE_ENGINE1.md                    # Gate 1 evaluation evidence matrix (Shrilakshmi)
│   └── documentation/
│       ├── B1_Limitation_Note.md                      # Engine 1 B1 limitation note
│       ├── DATABASE_DOCUMENTATION.md                  # Comprehensive schema and constraint dictionary
│       └── DATABASE_TESTING_REPORT.md                 # Integrity tests and trigger validation results
│
├── [ENGINE 2 - LOGIC & RULE]
│   ├── engine2_ranking.cpp                            # C++ standalone DSA implementation (Hand-built Max-Heap)
│   ├── server.js                                      # Node.js REST API backend server (Zero external dependencies)
│   ├── engine2_backend.py                             # Python implementation of Engine 2 ranking & CustomMaxHeap
│   ├── test_engine2.js                                # Automated unit test suite (5/5 PASS)
│   ├── package.json                                   # NPM project configuration
│   ├── GATE_00_EVIDENCE_ENGINE2.md                    # Gate 0 evaluation evidence matrix (Vivek B M)
│   ├── GATE_01_EVIDENCE_ENGINE2.md                    # Gate 1 evaluation evidence matrix (Vivek B M)
│   └── documentation/
│       └── ENGINE_02_ALGORITHM_DOCUMENTATION.md       # Comprehensive algorithm design & mathematical proofs
│
└── diagrams/
    ├── AS_IS_Workflow.md                              # Mermaid chart of manual AS-IS process
    └── TO_BE_Workflow.md                              # Mermaid chart of 4-engine TO-BE system
```

---

## 4. How to Run Engine 2

### Option A: Run Automated Test Suite (Node.js)
```bash
node test_engine2.js
```

### Option B: Run REST API Backend Server (Node.js)
```bash
node server.js
# Open http://localhost:5000 in your browser for the interactive console!
```

### Option C: Run Python Implementation
```bash
python engine2_backend.py
```

### Option D: Compile and Run Standalone C++ (DSA)
```bash
g++ -std=c++17 engine2_ranking.cpp -o engine2_ranking.exe
./engine2_ranking.exe
```

---

## 5. Current Gate Status
- ✅ **Gate 0 (Problem Approval — 5 Marks):** Cleared for Engine 1 (`GATE_00_EVIDENCE_ENGINE1.md`) & Engine 2 (`GATE_00_EVIDENCE_ENGINE2.md`).
- ✅ **Gate 1 (Requirements Baseline — 10 Marks):** Cleared for Engine 1 (`GATE_01_EVIDENCE_ENGINE1.md`) & Engine 2 (`GATE_01_EVIDENCE_ENGINE2.md`).
