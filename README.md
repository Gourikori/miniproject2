# Tourist Place Search and Ranking System – Engine 1 (Data & Integrity)

**Department:** Bachelor of Computer Applications, KLE Technological University, Hubballi  
**Theme:** Theme 4 — Reporting and MIS System / Rules Check Records Register  
**Student:** Shrilakshmi G.S (USN: `01FE24BCA314`)  
**Faculty Guides:** Prof. Pavankumar Vadavi, Prof. Sayeeda Anjum  
**Repository:** [https://github.com/shri030306/Mini-Project-Engine01-](https://github.com/shri030306/Mini-Project-Engine01-)  

---

## 1. Project Overview

The **Tourist Place Search and Ranking System** is a decision-support and reporting system designed to eliminate unverified travel information, arbitrary entry fee hikes, and inaccurate visitor ratings for destinations across Karnataka.

This repository hosts **Engine 1: Data and Integrity**, responsible for:
- Database architecture and relational schema modeling
- Enforcing non-violable data integrity rules (CHECK constraints, unique keys, foreign keys)
- Implementing an automated Audit Trail Register (`tourist_places_audit_log`) and triggers
- Providing MIS executive reporting views for administrative decision-making

---

## 2. Team Architecture & Responsibilities

- **Shrilakshmi G.S (Engine 1):** Database Management Systems – Data and Integrity
- **Vivek B M (Engine 2):** Logic & Algorithms – C++ Multi-Factor Ranking & Heap Sort
- **Gouri K (Engine 3):** Web Technologies – Client Interface & Interactive Presentation
- **Team 02 (Engine 4):** Testing & SDLC – System Verification & Traceability

---

## 3. Repository Structure

```
├── README.md
├── gate_0_database.sql                            # Gate 0 prototype SQL script (12 destinations)
├── database_queries.sql                           # Gate 1 master SQL script (34 destinations + Audit triggers)
├── GATE_00_EVIDENCE_ENGINE1.md                    # Gate 0 evaluation evidence matrix
├── GATE_01_EVIDENCE_ENGINE1.md                    # Gate 1 evaluation evidence matrix
├── diagrams/
│   ├── AS_IS_Workflow.md                          # Mermaid chart of manual AS-IS process
│   └── TO_BE_Workflow.md                          # Mermaid chart of 4-engine TO-BE system
└── documentation/
    ├── B1_Limitation_Note.md                      # Theme 4 B1 Limitation Note
    ├── DATABASE_DOCUMENTATION.md                  # Comprehensive schema and constraint dictionary
    └── DATABASE_TESTING_REPORT.md                 # 10 integrity tests and trigger validation results
```

---

## 4. Current Development Status

- ✅ **Gate 0 (Problem Approval — 5 Marks):** Completed and verified with prototype database and Theme 4 B1 limitation proof.
- ✅ **Gate 1 (Requirements Baseline — 10 Marks):** Ready with 34 Karnataka destinations, automated audit triggers, non-violable CHECK rules, and MIS views.

