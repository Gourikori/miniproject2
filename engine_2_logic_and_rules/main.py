"""
================================================================================
KLE TECHNOLOGICAL UNIVERSITY
Theme: Search and Ranking System
Project: Tourist Place Search and Ranking System
ENGINE 2: Logic & Rule Entrypoint
================================================================================
Run this file to test Engine 2 directly:
    python main.py
================================================================================
"""

import sys
from demo_and_benchmark import run_demo, run_benchmark

def main():
    print("=" * 80)
    print("   KLE TECHNOLOGICAL UNIVERSITY - CAPSTONE / COURSE PROJECT")
    print("   THEME: SEARCH AND RANKING SYSTEM")
    print("   ENGINE 2: LOGIC & RULE (Data Structures & Programming)")
    print("   Member 2 Ownership")
    print("=" * 80)
    print("\n[1] Running Core Ranking & Autocomplete Demonstration...\n")
    run_demo()
    print("\n[2] Running Algorithm Complexity Benchmark (Heap vs Full Sort)...\n")
    run_benchmark()
    print("\n[✔] Engine 2 execution completed successfully.")
    print("=" * 80)

if __name__ == "__main__":
    main()
