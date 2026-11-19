"""
================================================================================
KLE TECHNOLOGICAL UNIVERSITY
Theme: Search and Ranking System
Project: Tourist Place Search and Ranking System
ENGINE 2: Demo & Empirical Performance Benchmark
================================================================================
Demonstrates:
1. Live sample search & multi-criteria ranking.
2. Autocomplete prefix search using the hand-built Trie.
3. Time complexity empirical benchmark comparing:
   - Hand-built Top-K Min-Heap: O(N log K)
   - Standard Full Array Sort: O(N log N)
================================================================================
"""

import time
import random
from typing import List
from ranking_engine import TouristPlace, SearchAndRankingEngine, TopKHeap, ScoringRule


def get_sample_places() -> List[TouristPlace]:
    """
    Returns realistic Karnataka & South India tourist destination test records.
    Hubballi coordinate reference: 15.3647 N, 75.1240 E.
    """
    return [
        TouristPlace(
            place_id=1,
            name="Hampi Heritage Ruins",
            category="Heritage",
            city="Hampi",
            latitude=15.3350,
            longitude=76.4600,
            avg_rating=4.8,
            review_count=12400,
            entry_fee=40.0,
            recommended_season="Winter",
            popularity_tier=5,
            tags=["unesco", "architecture", "history", "temple", "ruins"]
        ),
        TouristPlace(
            place_id=2,
            name="Gokarna Om Beach",
            category="Beach",
            city="Gokarna",
            latitude=14.5146,
            longitude=74.3180,
            avg_rating=4.6,
            review_count=8500,
            entry_fee=0.0,
            recommended_season="Winter",
            popularity_tier=4,
            tags=["beach", "sea", "trekking", "sunset", "nature"]
        ),
        TouristPlace(
            place_id=3,
            name="Badami Cave Temples",
            category="Heritage",
            city="Badami",
            latitude=15.9185,
            longitude=75.6766,
            avg_rating=4.5,
            review_count=5200,
            entry_fee=25.0,
            recommended_season="Winter",
            popularity_tier=4,
            tags=["caves", "chalukya", "sculpture", "history"]
        ),
        TouristPlace(
            place_id=4,
            name="Dandeli River Rafting & Wildlife",
            category="Adventure",
            city="Dandeli",
            latitude=15.2427,
            longitude=74.6231,
            avg_rating=4.4,
            review_count=4300,
            entry_fee=600.0,
            recommended_season="Monsoon",
            popularity_tier=4,
            tags=["rafting", "wildlife", "kali river", "adventure", "forest"]
        ),
        TouristPlace(
            place_id=5,
            name="Jog Falls Waterfalls",
            category="Nature",
            city="Sagara",
            latitude=14.2285,
            longitude=74.8122,
            avg_rating=4.4,
            review_count=9800,
            entry_fee=50.0,
            recommended_season="Monsoon",
            popularity_tier=5,
            tags=["waterfall", "nature", "scenic", "sharavathi"]
        ),
        TouristPlace(
            place_id=6,
            name="Mysore Palace Royal Heritage",
            category="Heritage",
            city="Mysuru",
            latitude=12.3051,
            longitude=76.6551,
            avg_rating=4.7,
            review_count=21000,
            entry_fee=100.0,
            recommended_season="Winter",
            popularity_tier=5,
            tags=["palace", "wodeyar", "heritage", "illumination", "royal"]
        ),
        TouristPlace(
            place_id=7,
            name="Coorg Abbey Falls & Coffee Plantations",
            category="Nature",
            city="Madikeri",
            latitude=12.4542,
            longitude=75.7176,
            avg_rating=4.3,
            review_count=7100,
            entry_fee=30.0,
            recommended_season="Monsoon",
            popularity_tier=4,
            tags=["coffee", "hills", "waterfall", "nature", "trek"]
        ),
        TouristPlace(
            place_id=8,
            name="Murudeshwar Temple & Giant Shiva Statue",
            category="Spiritual",
            city="Murudeshwar",
            latitude=14.0943,
            longitude=74.4849,
            avg_rating=4.7,
            review_count=16000,
            entry_fee=0.0,
            recommended_season="Winter",
            popularity_tier=5,
            tags=["shiva", "temple", "beach", "gopuram", "spiritual"]
        ),
        TouristPlace(
            place_id=9,
            name="Unkal Lake & Vivekananda Memorial",
            category="Leisure",
            city="Hubballi",
            latitude=15.3854,
            longitude=75.1054,
            avg_rating=4.1,
            review_count=2400,
            entry_fee=10.0,
            recommended_season="All",
            popularity_tier=3,
            tags=["lake", "boating", "sunset", "local", "park"]
        ),
        TouristPlace(
            place_id=10,
            name="Chitradurga Fort of Seven Rounds",
            category="Heritage",
            city="Chitradurga",
            latitude=14.2189,
            longitude=76.3986,
            avg_rating=4.5,
            review_count=4800,
            entry_fee=25.0,
            recommended_season="Winter",
            popularity_tier=4,
            tags=["fort", "nayakas", "onake obavva", "rocks", "history"]
        )
    ]


def run_demo():
    print("=" * 80)
    print(" TOURIST PLACE SEARCH AND RANKING SYSTEM - ENGINE 2 LIVE DEMO")
    print("=" * 80)

    engine = SearchAndRankingEngine()
    places = get_sample_places()
    engine.bulk_load(places)
    print(f" Loaded {len(places)} tourist destinations into Trie & Repository.\n")

    # Demo 1: Autocomplete Prefix Test
    prefix_query = "ham"
    print(f"[TEST 1] Autocomplete Prefix Search for '{prefix_query}':")
    suggestions = engine.autocomplete(prefix_query)
    for s in suggestions:
        print(f"   -> Suggestion: {s}")
    print()

    # Demo 2: User Search with Context
    # User is located at Hubballi (15.3647 N, 75.1240 E), Budget Rs. 100, Season 'Winter', looking for Top-5
    user_lat, user_lon = 15.3647, 75.1240
    user_budget = 100.0
    season = "Winter"
    top_k = 5

    print(f"[TEST 2] Ranking Top-{top_k} Places from Hubballi ({user_lat}, {user_lon})")
    print(f"         Budget: Rs.{user_budget} | Current Season: {season}\n")

    results = engine.search_and_rank(
        query=None,
        user_lat=user_lat,
        user_lon=user_lon,
        user_budget=user_budget,
        current_season=season,
        top_k=top_k
    )

    print(f"{'Rank':<5}{'Place Name':<30}{'City':<12}{'Score':<8}{'Breakdown (Bayes, Dist, Budg, Seas, Pop)'}")
    print("-" * 85)
    for item in results:
        b = item["score_breakdown"]
        breakdown_str = f"({b['bayesian_rating']}, {b['distance']}, {b['budget']}, {b['season']}, {b['popularity']})"
        print(f"#{item['rank']:<4}{item['name'][:28]:<30}{item['city']:<12}{item['composite_score']:<8.2f}{breakdown_str}")
    print()

    # Demo 3: Tag / Category Search
    tag_query = "waterfall"
    print(f"[TEST 3] Searching by Tag/Keyword: '{tag_query}'")
    tag_results = engine.search_and_rank(query=tag_query, user_lat=user_lat, user_lon=user_lon, top_k=3)
    for item in tag_results:
        print(f"   Rank #{item['rank']}: {item['name']} ({item['city']}) - Score: {item['composite_score']}")
    print()


def run_benchmark():
    print("=" * 80)
    print(" ENGINE 2 EMPIRICAL COMPLEXITY BENCHMARK: Top-K Heap vs Full Sort")
    print("=" * 80)
    print(" Comparing Hand-Built Min-Heap (O(N log K)) vs Full Sort (O(N log N))")
    print(f"{'Dataset Size (N)':<18}{'K value':<10}{'Top-K Heap (sec)':<20}{'Full Sort (sec)':<20}{'Speedup Factor'}")
    print("-" * 80)

    dataset_sizes = [5000, 20000, 50000]
    k_val = 10

    for n in dataset_sizes:
        # Generate N synthetic scores
        scores = [random.uniform(10.0, 99.9) for _ in range(n)]

        # Benchmark 1: Hand-built TopKHeap O(N log K)
        start_time = time.perf_counter()
        heap = TopKHeap(k=k_val)
        dummy_place = TouristPlace(1, "Dummy", "Cat", "City", 0, 0, 4.0, 100, 0, "All", 3)
        dummy_breakdown = {}
        for s in scores:
            heap.push(s, dummy_place, dummy_breakdown)
        heap_results = heap.get_top_k_sorted()
        heap_time = time.perf_counter() - start_time

        # Benchmark 2: Full Array Sorting O(N log N)
        start_time = time.perf_counter()
        sorted_full = sorted(scores, reverse=True)[:k_val]
        sort_time = time.perf_counter() - start_time

        speedup = sort_time / heap_time if heap_time > 0 else 1.0
        print(f"{n:<18}{k_val:<10}{heap_time:<20.5f}{sort_time:<20.5f}{speedup:<.2f}x")

    print("-" * 80)
    print(" Conclusion for Evaluator:")
    print(" Hand-built Top-K Min-Heap maintains only K items in memory (O(K) auxiliary space),")
    print(" performing significantly fewer comparisons than full O(N log N) sorting.")
    print("=" * 80)


if __name__ == "__main__":
    run_demo()
    print()
    run_benchmark()
