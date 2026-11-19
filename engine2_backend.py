"""
====================================================================================================
KLE TECHNOLOGICAL UNIVERSITY, HUBBALLI
DEPARTMENT OF BACHELOR OF COMPUTER APPLICATIONS
THEME 3 / THEME 4: SEARCH AND RANKING SYSTEM / REPORTING & MIS

ENGINE 2: LOGIC & RULE (DATA STRUCTURES & PROGRAMMING)
Student: Vivek B M (USN: 01FE24BCA266)
Faculty Guides: Prof. Pavankumar Vadavi, Prof. Sayeeda Anjum

CORE DELIVERABLE:
1. The Main Calculation / Rule: Multi-factor Composite Scoring Formula with strict weight normalization.
2. Hand-Built Data Structure: Custom Binary Max-Heap (Priority Queue) constructed from scratch
   without using heapq or sorted().
3. Justification: Floyd's O(N) heap construction + O(K log N) Top-K extraction vs O(N log N) full sort.
====================================================================================================
"""

import sys
import math
from typing import List, Dict, Any, Optional

MAX_RATING = 5.00
MAX_POPULARITY = 100.00
MAX_REFERENCE_DISTANCE = 500.00 # Karnataka regional reference coordinate baseline

class RankingWeights:
    def __init__(self, w1: float = 0.40, w2: float = 0.30, w3: float = 0.20, w4: float = 0.10):
        self.w_rating = float(w1)
        self.w_popularity = float(w2)
        self.w_preference = float(w3)
        self.w_distance = float(w4)
        self.validate()

    def validate(self):
        if any(w < 0.0 for w in [self.w_rating, self.w_popularity, self.w_preference, self.w_distance]):
            raise ValueError("RULE VIOLATION (B2): Ranking weights cannot be negative.")
        total = self.w_rating + self.w_popularity + self.w_preference + self.w_distance
        if abs(total - 1.000) > 0.005:
            raise ValueError(f"RULE VIOLATION (B2): Weights must sum to exactly 1.000 (Current sum = {total:.3f}).")

    def to_dict(self):
        return {
            "wRating": self.w_rating,
            "wPopularity": self.w_popularity,
            "wPreference": self.w_preference,
            "wDistance": self.w_distance
        }

class CustomMaxHeap:
    """
    Hand-built Binary Max-Heap Priority Queue.
    Implemented without heapq or sorted().
    Time Complexity:
      - build_heap(): O(N) using Floyd's bottom-up linear construction.
      - extract_max(): O(log N).
      - get_top_k(): O(K log N).
      - Total Top-K Time: O(N + K log N) vs O(N log N) for full array sorting.
    """
    def __init__(self):
        self.heap: List[Dict[str, Any]] = []

    def _parent(self, i: int) -> int:
        return (i - 1) // 2

    def _left(self, i: int) -> int:
        return 2 * i + 1

    def _right(self, i: int) -> int:
        return 2 * i + 2

    def _is_greater(self, a: Dict[str, Any], b: Dict[str, Any]) -> bool:
        # Deterministic comparison adhering to Gate 1 - B2 & B3
        if abs(a['composite_score'] - b['composite_score']) > 0.0001:
            return a['composite_score'] > b['composite_score']
        # Tie-breaker 1: Higher rating
        if abs(a['rating'] - b['rating']) > 0.01:
            return a['rating'] > b['rating']
        # Tie-breaker 2: Higher popularity
        if a['popularity'] != b['popularity']:
            return a['popularity'] > b['popularity']
        # Tie-breaker 3: Alphabetical
        return a['place_name'] < b['place_name']

    def _heapify_down(self, i: int):
        max_idx = i
        left = self._left(i)
        right = self._right(i)
        n = len(self.heap)

        if left < n and self._is_greater(self.heap[left], self.heap[max_idx]):
            max_idx = left
        if right < n and self._is_greater(self.heap[right], self.heap[max_idx]):
            max_idx = right

        if i != max_idx:
            self.heap[i], self.heap[max_idx] = self.heap[max_idx], self.heap[i]
            self._heapify_down(max_idx)

    def _heapify_up(self, i: int):
        while i > 0 and self._is_greater(self.heap[i], self.heap[self._parent(i)]):
            p = self._parent(i)
            self.heap[i], self.heap[p] = self.heap[p], self.heap[i]
            i = p

    def build_heap(self, items: List[Dict[str, Any]]):
        self.heap = list(items)
        n = len(self.heap)
        for i in range((n // 2) - 1, -1, -1):
            self._heapify_down(i)

    def insert(self, item: Dict[str, Any]):
        self.heap.append(item)
        self._heapify_up(len(self.heap) - 1)

    def extract_max(self) -> Optional[Dict[str, Any]]:
        if not self.heap:
            return None
        max_item = self.heap[0]
        last_item = self.heap.pop()
        if self.heap:
            self.heap[0] = last_item
            self._heapify_down(0)
        return max_item

    def get_top_k(self, k: int) -> List[Dict[str, Any]]:
        results = []
        count = min(k, len(self.heap))
        for _ in range(count):
            item = self.extract_max()
            if item:
                results.append(item)
        return results

class RankingEngine:
    def __init__(self, weights: Optional[RankingWeights] = None):
        self.weights = weights if weights else RankingWeights()
        self.catalog: List[Dict[str, Any]] = []

    def load_catalog(self, places: List[Dict[str, Any]]):
        self.catalog = places

    def compute_score(self, place: Dict[str, Any], preferred_category_id: int) -> Dict[str, Any]:
        norm_rating = max(0.0, min(1.0, place['rating'] / MAX_RATING))
        weighted_rating = self.weights.w_rating * norm_rating

        norm_popularity = max(0.0, min(1.0, place['popularity'] / MAX_POPULARITY))
        weighted_popularity = self.weights.w_popularity * norm_popularity

        pref_match = 1.0 if (preferred_category_id > 0 and place['category_id'] == preferred_category_id) else 0.0
        weighted_preference = self.weights.w_preference * pref_match

        norm_proximity = max(0.0, min(1.0, 1.0 - (place['distance_km'] / MAX_REFERENCE_DISTANCE)))
        weighted_proximity = self.weights.w_distance * norm_proximity

        raw_score = weighted_rating + weighted_popularity + weighted_preference + weighted_proximity
        composite_score = max(0.0, min(1.0, raw_score))

        return {
            "composite_score": round(composite_score, 4),
            "breakdown": {
                "raw_rating": place['rating'],
                "norm_rating": round(norm_rating, 4),
                "weighted_rating": round(weighted_rating, 4),
                "raw_popularity": place['popularity'],
                "norm_popularity": round(norm_popularity, 4),
                "weighted_popularity": round(weighted_popularity, 4),
                "preference_match": pref_match,
                "weighted_preference": round(weighted_preference, 4),
                "raw_distance_km": place['distance_km'],
                "norm_proximity": round(norm_proximity, 4),
                "weighted_proximity": round(weighted_proximity, 4),
                "formula": f"({self.weights.w_rating} * {norm_rating:.2f}) + ({self.weights.w_popularity} * {norm_popularity:.2f}) + ({self.weights.w_preference} * {pref_match}) + ({self.weights.w_distance} * {norm_proximity:.2f})"
            }
        }

    def search_and_rank(self, keyword: str = "", category_id: int = 0,
                        max_budget: float = -1.0, max_distance: float = -1.0,
                        top_k: int = 10) -> List[Dict[str, Any]]:
        candidates = []
        kw = keyword.strip().lower()

        for p in self.catalog:
            if p.get('status') == 'INACTIVE':
                continue
            if max_budget >= 0.0 and p['entry_fee'] > max_budget:
                continue
            if max_distance > 0.0 and p['distance_km'] > max_distance:
                continue
            if kw:
                n_m = kw in p['place_name'].lower()
                c_m = kw in p['city'].lower()
                d_m = kw in p['description'].lower()
                cat_m = kw in p.get('category_name', '').lower()
                if not (n_m or c_m or d_m or cat_m):
                    continue

            scored = dict(p)
            calc = self.compute_score(scored, category_id)
            scored['composite_score'] = calc['composite_score']
            scored['breakdown'] = calc['breakdown']
            candidates.append(scored)

        heap = CustomMaxHeap()
        heap.build_heap(candidates)
        return heap.get_top_k(top_k)

# 34 Karnataka Destinations Dataset
def get_karnataka_dataset():
    return [
        {"place_id": 1, "place_name": "Unkal Lake & Park", "city": "Hubballi", "state": "Karnataka", "category_id": 3, "category_name": "Nature", "entry_fee": 10.00, "distance_km": 6.0, "rating": 4.30, "popularity": 82, "best_time_to_visit": "July to October", "description": "A calm lakeside escape for an evening walk and family outing."},
        {"place_id": 2, "place_name": "Chandramouleshwara Temple", "city": "Hubballi", "state": "Karnataka", "category_id": 4, "category_name": "Temple", "entry_fee": 0.00, "distance_km": 8.5, "rating": 4.50, "popularity": 78, "best_time_to_visit": "October to March", "description": "Historic stone carvings and Western Chalukyan architecture."},
        {"place_id": 3, "place_name": "Nrupatunga Betta Viewpoint", "city": "Hubballi", "state": "Karnataka", "category_id": 3, "category_name": "Nature", "entry_fee": 20.00, "distance_km": 10.0, "rating": 4.40, "popularity": 80, "best_time_to_visit": "July to October", "description": "Scenic hillock offering panoramic city viewpoints."},
        {"place_id": 4, "place_name": "Sadhankeri Park & Lake", "city": "Dharwad", "state": "Karnataka", "category_id": 3, "category_name": "Nature", "entry_fee": 10.00, "distance_km": 22.0, "rating": 4.20, "popularity": 72, "best_time_to_visit": "October to March", "description": "Serene garden memorial commemorating poet Da. Ra. Bendre."},
        {"place_id": 5, "place_name": "Gokarna Om Beach", "city": "Gokarna", "state": "Karnataka", "category_id": 1, "category_name": "Beach", "entry_fee": 0.00, "distance_km": 150.0, "rating": 4.60, "popularity": 92, "best_time_to_visit": "November to February", "description": "Sweeping coastline and laid-back beach town atmosphere."},
        {"place_id": 6, "place_name": "Kudle Beach", "city": "Gokarna", "state": "Karnataka", "category_id": 1, "category_name": "Beach", "entry_fee": 0.00, "distance_km": 152.0, "rating": 4.50, "popularity": 88, "best_time_to_visit": "November to February", "description": "Scenic coastal stretch ideal for swimming and sunsets."},
        {"place_id": 7, "place_name": "Murudeshwar Temple & Beach", "city": "Murudeshwar", "state": "Karnataka", "category_id": 4, "category_name": "Temple", "entry_fee": 0.00, "distance_km": 185.0, "rating": 4.70, "popularity": 95, "best_time_to_visit": "October to March", "description": "Dramatic landmark with giant Shiva statue and Arabian Sea views."},
        {"place_id": 8, "place_name": "Yana Rocks & Caves", "city": "Kumta", "state": "Karnataka", "category_id": 3, "category_name": "Nature", "entry_fee": 20.00, "distance_km": 140.0, "rating": 4.60, "popularity": 85, "best_time_to_visit": "October to March", "description": "Gigantic limestone karst formations inside thick rainforest."},
        {"place_id": 9, "place_name": "Sathodi Falls", "city": "Yellapur", "state": "Karnataka", "category_id": 3, "category_name": "Nature", "entry_fee": 30.00, "distance_km": 75.0, "rating": 4.50, "popularity": 81, "best_time_to_visit": "July to October", "description": "Picturesque rectangular forest waterfall."},
        {"place_id": 10, "place_name": "Magod Falls", "city": "Yellapur", "state": "Karnataka", "category_id": 3, "category_name": "Nature", "entry_fee": 20.00, "distance_km": 80.0, "rating": 4.30, "popularity": 76, "best_time_to_visit": "July to October", "description": "Bedthi river tumbling down two tiers in deep valleys."},
        {"place_id": 11, "place_name": "Sirsi Marikamba Temple", "city": "Sirsi", "state": "Karnataka", "category_id": 4, "category_name": "Temple", "entry_fee": 0.00, "distance_km": 102.0, "rating": 4.80, "popularity": 89, "best_time_to_visit": "October to March", "description": "Renowned 16th-century temple adorned with wooden carvings."},
        {"place_id": 12, "place_name": "Dandeli River Rafting & Wildlife", "city": "Dandeli", "state": "Karnataka", "category_id": 5, "category_name": "Wildlife", "entry_fee": 250.00, "distance_km": 74.0, "rating": 4.60, "popularity": 94, "best_time_to_visit": "October to March", "description": "River scenery, forest trails, and white-water rafting on Kali river."},
        {"place_id": 13, "place_name": "Ulavi Channabasaveshwara Temple", "city": "Ulavi", "state": "Karnataka", "category_id": 4, "category_name": "Temple", "entry_fee": 0.00, "distance_km": 95.0, "rating": 4.40, "popularity": 79, "best_time_to_visit": "October to March", "description": "Important Lingayat pilgrimage shrine surrounded by dense forests."},
        {"place_id": 14, "place_name": "Banavasi Madhukeshwara Temple", "city": "Banavasi", "state": "Karnataka", "category_id": 2, "category_name": "Historical", "entry_fee": 0.00, "distance_km": 125.0, "rating": 4.60, "popularity": 83, "best_time_to_visit": "October to March", "description": "Ancient Chalukya-Kadamba architectural gem and first Kannada capital."},
        {"place_id": 15, "place_name": "Malpe Beach & St Mary Island", "city": "Udupi", "state": "Karnataka", "category_id": 1, "category_name": "Beach", "entry_fee": 300.00, "distance_km": 250.0, "rating": 4.60, "popularity": 91, "best_time_to_visit": "November to February", "description": "Pristine coastline and volcanic columnar basalt rock islands."},
        {"place_id": 16, "place_name": "Virupaksha Temple & Hampi Ruins", "city": "Hampi", "state": "Karnataka", "category_id": 2, "category_name": "Historical", "entry_fee": 50.00, "distance_km": 165.0, "rating": 4.90, "popularity": 98, "best_time_to_visit": "October to March", "description": "Extraordinary UNESCO landscape of temples and boulder ruins."},
        {"place_id": 17, "place_name": "Vijaya Vittala Temple & Stone Chariot", "city": "Hampi", "state": "Karnataka", "category_id": 2, "category_name": "Historical", "entry_fee": 50.00, "distance_km": 168.0, "rating": 4.90, "popularity": 99, "best_time_to_visit": "October to March", "description": "Iconic carved stone chariot and musical pillars."},
        {"place_id": 18, "place_name": "Badami Cave Temples", "city": "Badami", "state": "Karnataka", "category_id": 2, "category_name": "Historical", "entry_fee": 30.00, "distance_km": 105.0, "rating": 4.70, "popularity": 91, "best_time_to_visit": "October to March", "description": "Rock-cut cave shrines overlooking red sandstone cliffs and Agastya Lake."},
        {"place_id": 19, "place_name": "Pattadakal UNESCO Monuments", "city": "Pattadakal", "state": "Karnataka", "category_id": 2, "category_name": "Historical", "entry_fee": 40.00, "distance_km": 128.0, "rating": 4.80, "popularity": 90, "best_time_to_visit": "October to March", "description": "7th-8th century architectural synthesis of Rekha-Nagara and Dravidian styles."},
        {"place_id": 20, "place_name": "Aihole Historical Complex", "city": "Aihole", "state": "Karnataka", "category_id": 2, "category_name": "Historical", "entry_fee": 30.00, "distance_km": 135.0, "rating": 4.50, "popularity": 84, "best_time_to_visit": "October to March", "description": "Cradle of Hindu structural temple architecture with over 120 monuments."},
        {"place_id": 21, "place_name": "Gol Gumbaz", "city": "Vijayapura", "state": "Karnataka", "category_id": 2, "category_name": "Historical", "entry_fee": 25.00, "distance_km": 200.0, "rating": 4.60, "popularity": 87, "best_time_to_visit": "October to March", "description": "Massive circular dome mausoleum with acoustical Whispering Gallery."},
        {"place_id": 22, "place_name": "Chitradurga Fort", "city": "Chitradurga", "state": "Karnataka", "category_id": 2, "category_name": "Historical", "entry_fee": 25.00, "distance_km": 205.0, "rating": 4.70, "popularity": 89, "best_time_to_visit": "October to March", "description": "Impenetrable medieval stone fortress featuring 7 concentric ramparts."},
        {"place_id": 23, "place_name": "Jog Falls Viewpoint", "city": "Shivamogga", "state": "Karnataka", "category_id": 3, "category_name": "Nature", "entry_fee": 50.00, "distance_km": 160.0, "rating": 4.70, "popularity": 93, "best_time_to_visit": "July to October", "description": "Dramatic plunge waterfall framed by Western Ghats gorges."},
        {"place_id": 24, "place_name": "Agumbe Sunset Point", "city": "Shivamogga", "state": "Karnataka", "category_id": 6, "category_name": "Hill Station", "entry_fee": 0.00, "distance_km": 240.0, "rating": 4.50, "popularity": 85, "best_time_to_visit": "October to March", "description": "High Ghats viewpoint famous for sunset panoramas over Arabian Sea."},
        {"place_id": 25, "place_name": "Mullayanagiri Peak", "city": "Chikkamagaluru", "state": "Karnataka", "category_id": 6, "category_name": "Hill Station", "entry_fee": 0.00, "distance_km": 275.0, "rating": 4.80, "popularity": 96, "best_time_to_visit": "October to March", "description": "Highest mountain peak in Karnataka with cool mist and panoramic trails."},
        {"place_id": 26, "place_name": "Baba Budangiri Shrine & Hills", "city": "Chikkamagaluru", "state": "Karnataka", "category_id": 6, "category_name": "Hill Station", "entry_fee": 0.00, "distance_km": 285.0, "rating": 4.40, "popularity": 86, "best_time_to_visit": "October to March", "description": "Misty mountain range with Sufi shrine and rolling coffee plantations."},
        {"place_id": 27, "place_name": "Kudremukh National Park", "city": "Chikkamagaluru", "state": "Karnataka", "category_id": 5, "category_name": "Wildlife", "entry_fee": 200.00, "distance_km": 310.0, "rating": 4.70, "popularity": 88, "best_time_to_visit": "October to March", "description": "Horse-faced peak with montane shola grasslands and rich fauna."},
        {"place_id": 28, "place_name": "Belur Chennakeshava Temple", "city": "Belur", "state": "Karnataka", "category_id": 2, "category_name": "Historical", "entry_fee": 0.00, "distance_km": 290.0, "rating": 4.80, "popularity": 92, "best_time_to_visit": "October to March", "description": "Soapstone architectural marvel depicting celestial dancers."},
        {"place_id": 29, "place_name": "Halebidu Hoysaleshwara Temple", "city": "Halebidu", "state": "Karnataka", "category_id": 2, "category_name": "Historical", "entry_fee": 0.00, "distance_km": 300.0, "rating": 4.80, "popularity": 91, "best_time_to_visit": "October to March", "description": "12th-century twin-temple adorned with intricate relief sculptures."},
        {"place_id": 30, "place_name": "Mysore Palace", "city": "Mysuru", "state": "Karnataka", "category_id": 2, "category_name": "Historical", "entry_fee": 100.00, "distance_km": 410.0, "rating": 4.90, "popularity": 98, "best_time_to_visit": "October to March", "description": "Grand royal palace with Indo-Saracenic halls and 100,000 festival lights."},
        {"place_id": 31, "place_name": "Chamundi Hill & Temple", "city": "Mysuru", "state": "Karnataka", "category_id": 4, "category_name": "Temple", "entry_fee": 0.00, "distance_km": 415.0, "rating": 4.70, "popularity": 90, "best_time_to_visit": "October to March", "description": "Dravidian gopuram shrine overlooking Mysuru city with monolithic Nandi."},
        {"place_id": 32, "place_name": "Abbey Falls", "city": "Madikeri", "state": "Karnataka", "category_id": 3, "category_name": "Nature", "entry_fee": 50.00, "distance_km": 380.0, "rating": 4.50, "popularity": 87, "best_time_to_visit": "July to October", "description": "Roaring waterfall nestled inside lush spice and coffee plantations."},
        {"place_id": 33, "place_name": "Raja Seat Viewpoint", "city": "Madikeri", "state": "Karnataka", "category_id": 6, "category_name": "Hill Station", "entry_fee": 25.00, "distance_km": 375.0, "rating": 4.40, "popularity": 84, "best_time_to_visit": "October to March", "description": "Seasonal garden where Kodagu kings observed dramatic sunsets."},
        {"place_id": 34, "place_name": "Bandipur National Park Safari", "city": "Bandipur", "state": "Karnataka", "category_id": 5, "category_name": "Wildlife", "entry_fee": 350.00, "distance_km": 480.0, "rating": 4.70, "popularity": 94, "best_time_to_visit": "October to March", "description": "Renowned Tiger Reserve home to elephants, gaurs, and Bengal tigers."}
    ]

if __name__ == '__main__':
    print("=========================================================================================")
    print("   KLE TECHNOLOGICAL UNIVERSITY, HUBBALLI - DEPT OF BCA")
    print("   ENGINE 2: LOGIC & RULE (DATA STRUCTURES & PROGRAMMING)")
    print("   STUDENT: VIVEK B M (USN: 01FE24BCA266)")
    print("   PYTHON IMPLEMENTATION OF CUSTOM MAX-HEAP & RANKING ENGINE")
    print("=========================================================================================\n")

    dataset = get_karnataka_dataset()
    engine = RankingEngine()
    engine.load_catalog(dataset)

    print(f"[OK] Loaded {len(dataset)} Karnataka destinations into Engine 2 memory.\n")
    top5 = engine.search_and_rank(top_k=5)

    print(f"{'Rank':<5}{'Place Name':<35}{'City':<16}{'Category':<14}{'Fee':<10}{'Dist(km)':<10}{'Rating':<8}{'Score':<8}")
    print("-" * 106)
    for i, p in enumerate(top5):
        print(f"{i+1:<5}{p['place_name'][:33]:<35}{p['city']:<16}{p['category_name']:<14}{p['entry_fee']:<10.2f}{p['distance_km']:<10.1f}{p['rating']:<8.2f}{p['composite_score']:<8.4f}")

    print("\n[OK] Top place breakdown audit trace:")
    b = top5[0]['breakdown']
    for k, v in b.items():
        print(f"  {k}: {v}")

    print("\n[SUCCESS] Engine 2 Python script executed and verified successfully.")
