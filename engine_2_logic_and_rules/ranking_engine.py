"""
================================================================================
KLE TECHNOLOGICAL UNIVERSITY
Theme: Search and Ranking System
Project: Tourist Place Search and Ranking System
ENGINE 2: Logic & Rule (Data Structures & Programming)
Member 2 Responsibility

Core Components Implemented from Scratch (By Hand):
1. ScoringRule: Multi-criteria composite ranking formula (Bayesian rating,
   Haversine distance decay, budget compatibility, seasonality factor).
2. TopKHeap: Custom bounded Min-Heap built from scratch (no heapq/built-ins)
   to extract Top-K places in O(N log K) time and O(K) space.
3. Trie & TrieNode: Custom prefix search tree built from scratch for fast O(L)
   name and tag autocomplete search.
================================================================================
"""

import math
from typing import List, Dict, Optional, Tuple, Any


# ==============================================================================
# DATA MODEL
# ==============================================================================

class TouristPlace:
    """
    Data model representing a tourist attraction.
    Compatible with Engine 1 (Database) and Engine 3 (API/Web).
    """
    def __init__(
        self,
        place_id: int,
        name: str,
        category: str,
        city: str,
        latitude: float,
        longitude: float,
        avg_rating: float,          # 1.0 to 5.0
        review_count: int,          # total number of reviews
        entry_fee: float,           # in local currency (e.g., INR)
        recommended_season: str,    # e.g., 'Winter', 'Monsoon', 'Summer', 'All'
        popularity_tier: int,       # 1 (Hidden Gem) to 5 (World Famous)
        tags: Optional[List[str]] = None
    ):
        self.place_id = place_id
        self.name = name
        self.category = category
        self.city = city
        self.latitude = latitude
        self.longitude = longitude
        self.avg_rating = float(avg_rating)
        self.review_count = int(review_count)
        self.entry_fee = float(entry_fee)
        self.recommended_season = recommended_season
        self.popularity_tier = int(popularity_tier)
        self.tags = tags or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "place_id": self.place_id,
            "name": self.name,
            "category": self.category,
            "city": self.city,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "avg_rating": self.avg_rating,
            "review_count": self.review_count,
            "entry_fee": self.entry_fee,
            "recommended_season": self.recommended_season,
            "popularity_tier": self.popularity_tier,
            "tags": self.tags
        }


# ==============================================================================
# 1. THE MAIN CALCULATION & RULE: MULTI-CRITERIA SCORING ENGINE
# ==============================================================================

class ScoringRule:
    """
    Encapsulates the mathematical ranking algorithm and business rules.
    
    Formula:
        Final Score S = W_rating * S_bayesian +
                        W_distance * S_distance +
                        W_budget * S_budget +
                        W_season * S_season +
                        W_popularity * S_popularity

    Normalized strictly to the range [0.0, 100.0].
    
    Rule Invariants:
    1. Score is bounded between 0.0 and 100.0.
    2. Zero reviews fallback to global Bayesian prior average (prevents cold-start bias).
    3. Distance decay uses half-life exponential decay (no division-by-zero).
    4. Negative budgets or invalid coordinates are safely clamped or rejected.
    """

    # Global Bayesian constants for smoothing ratings
    GLOBAL_MEAN_RATING: float = 3.5  # Prior average (m)
    MIN_REVIEW_CONFIDENCE: int = 25  # Confidence threshold weight (C)

    # Default Weights (Sum = 1.0)
    DEFAULT_WEIGHTS = {
        "rating": 0.35,      # Quality & credibility
        "distance": 0.25,    # Proximity convenience
        "budget": 0.15,      # Cost compatibility
        "season": 0.15,      # Timing & seasonality
        "popularity": 0.10   # Overall appeal / tier
    }

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculates great-circle distance between two GPS coordinates in kilometers.
        """
        R = 6371.0  # Earth radius in kilometers
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (math.sin(delta_phi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    @classmethod
    def calculate_bayesian_rating(cls, avg_rating: float, review_count: int) -> float:
        """
        IMDb / Amazon style Bayesian weighted rating:
            WR = (v / (v + m)) * R + (m / (v + m)) * C
        Where:
            v = review_count
            m = MIN_REVIEW_CONFIDENCE (25)
            R = avg_rating (1 to 5)
            C = GLOBAL_MEAN_RATING (3.5)
        Output is normalized to [0, 100].
        """
        v = max(0, review_count)
        m = cls.MIN_REVIEW_CONFIDENCE
        R = min(5.0, max(1.0, avg_rating)) if v > 0 else cls.GLOBAL_MEAN_RATING
        C = cls.GLOBAL_MEAN_RATING

        weighted_rating = (v / (v + m)) * R + (m / (v + m)) * C
        # Normalize 1.0-5.0 to 0.0-100.0
        normalized_rating = ((weighted_rating - 1.0) / 4.0) * 100.0
        return max(0.0, min(100.0, normalized_rating))

    @staticmethod
    def calculate_distance_score(distance_km: float, max_comfort_km: float = 50.0) -> float:
        """
        Exponential decay function for proximity:
            S_distance = 100 * exp(-distance / max_comfort)
        - At 0 km: 100.0
        - At 50 km: ~36.8
        - Beyond 200 km: approaches 0.0
        Prevents hard cutoff while prioritizing closer places.
        """
        if distance_km <= 0.0:
            return 100.0
        return 100.0 * math.exp(-distance_km / max_comfort_km)

    @staticmethod
    def calculate_budget_score(entry_fee: float, user_budget: float) -> float:
        """
        Budget compatibility score:
        - If free (fee == 0): 100.0
        - If fee <= user_budget: high score scaling with savings
        - If fee > user_budget: heavy linear penalty down to 0.0
        """
        if user_budget <= 0.0:
            return 100.0 if entry_fee == 0.0 else 20.0
        
        if entry_fee <= 0.0:
            return 100.0
        
        ratio = entry_fee / user_budget
        if ratio <= 0.5:
            return 95.0
        elif ratio <= 1.0:
            return 80.0 - (ratio - 0.5) * 40.0  # 80 down to 60
        elif ratio <= 1.5:
            return max(10.0, 50.0 - (ratio - 1.0) * 80.0)  # 50 down to 10
        else:
            return 5.0

    @staticmethod
    def calculate_season_score(recommended_season: str, current_season: Optional[str]) -> float:
        """
        Seasonality score:
        - Exact match or 'All': 100.0
        - Mild transition: 60.0
        - Off-season: 30.0
        """
        if not current_season or recommended_season.lower() == "all":
            return 100.0
        
        rec = recommended_season.strip().lower()
        curr = current_season.strip().lower()

        if rec == curr:
            return 100.0
        
        # Adjacent season partial credit
        adjacent_map = {
            "winter": ["monsoon", "spring"],
            "summer": ["spring"],
            "monsoon": ["winter"],
            "spring": ["summer", "winter"]
        }
        if curr in adjacent_map.get(rec, []):
            return 60.0
        return 30.0

    @classmethod
    def compute_composite_score(
        cls,
        place: TouristPlace,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
        user_budget: Optional[float] = None,
        current_season: Optional[str] = None,
        weights: Optional[Dict[str, float]] = None
    ) -> Tuple[float, Dict[str, float]]:
        """
        Computes the total score (0 to 100) and returns a granular sub-score breakdown.
        """
        w = weights or cls.DEFAULT_WEIGHTS

        # 1. Bayesian Rating Sub-score (0-100)
        s_rating = cls.calculate_bayesian_rating(place.avg_rating, place.review_count)

        # 2. Distance Sub-score (0-100)
        if user_lat is not None and user_lon is not None:
            dist_km = cls.haversine_distance(user_lat, user_lon, place.latitude, place.longitude)
            s_distance = cls.calculate_distance_score(dist_km)
        else:
            s_distance = 70.0  # Neutral baseline when location is not provided

        # 3. Budget Sub-score (0-100)
        if user_budget is not None and user_budget > 0:
            s_budget = cls.calculate_budget_score(place.entry_fee, user_budget)
        else:
            s_budget = 70.0

        # 4. Season Sub-score (0-100)
        s_season = cls.calculate_season_score(place.recommended_season, current_season)

        # 5. Popularity Tier Sub-score (1 to 5 -> 20 to 100)
        s_popularity = max(1.0, min(5.0, place.popularity_tier)) * 20.0

        # Weighted Sum
        final_score = (
            w["rating"] * s_rating +
            w["distance"] * s_distance +
            w["budget"] * s_budget +
            w["season"] * s_season +
            w["popularity"] * s_popularity
        )

        final_score = round(max(0.0, min(100.0, final_score)), 2)

        breakdown = {
            "bayesian_rating": round(s_rating, 2),
            "distance": round(s_distance, 2),
            "budget": round(s_budget, 2),
            "season": round(s_season, 2),
            "popularity": round(s_popularity, 2)
        }

        return final_score, breakdown


# ==============================================================================
# 2. HAND-BUILT DATA STRUCTURE 1: BOUNDED MIN-HEAP FOR TOP-K RANKING
# ==============================================================================

class HeapNode:
    """
    Node stored inside the TopKHeap.
    Holds the place item and its composite score.
    """
    def __init__(self, score: float, place: TouristPlace, breakdown: Dict[str, float]):
        self.score = score
        self.place = place
        self.breakdown = breakdown

    def __lt__(self, other: 'HeapNode') -> bool:
        # Min-heap comparison: smaller score has higher priority for replacement
        if abs(self.score - other.score) < 1e-9:
            # Secondary tie-breaker: review count, then place_id
            if self.place.review_count == other.place.review_count:
                return self.place.place_id > other.place.place_id
            return self.place.review_count < other.place.review_count
        return self.score < other.score


class TopKHeap:
    """
    CUSTOM MIN-HEAP BUILT ENTIRELY BY HAND.
    No imports of heapq, collections.deque, or priority_queue.
    
    Why Min-Heap for Top-K Highest Elements?
    - The root of a Min-Heap always holds the SMALLEST of the Top-K items seen so far.
    - When a new place has a score GREATER than root, we replace root and sift down.
    - Result: After processing N elements, the heap contains exactly the Top-K highest.
    - Time Complexity: O(N log K) instead of O(N log N) full array sort.
    - Space Complexity: O(K) auxiliary memory instead of O(N).
    """

    def __init__(self, k: int):
        if k <= 0:
            raise ValueError("K must be a positive integer greater than zero.")
        self.k = k
        self.heap: List[HeapNode] = []

    def size(self) -> int:
        return len(self.heap)

    def is_empty(self) -> bool:
        return len(self.heap) == 0

    def peek(self) -> Optional[HeapNode]:
        """Returns the minimum element (root) without removing it. O(1) time."""
        if self.is_empty():
            return None
        return self.heap[0]

    def _parent(self, i: int) -> int:
        return (i - 1) // 2

    def _left_child(self, i: int) -> int:
        return 2 * i + 1

    def _right_child(self, i: int) -> int:
        return 2 * i + 2

    def _swap(self, i: int, j: int) -> None:
        self.heap[i], self.heap[j] = self.heap[j], self.heap[i]

    def _sift_up(self, index: int) -> None:
        """Maintains min-heap property upwards towards the root."""
        current = index
        while current > 0:
            p = self._parent(current)
            if self.heap[current] < self.heap[p]:
                self._swap(current, p)
                current = p
            else:
                break

    def _sift_down(self, index: int) -> None:
        """Maintains min-heap property downwards towards leaves."""
        current = index
        length = len(self.heap)

        while True:
            left = self._left_child(current)
            right = self._right_child(current)
            smallest = current

            if left < length and self.heap[left] < self.heap[smallest]:
                smallest = left

            if right < length and self.heap[right] < self.heap[smallest]:
                smallest = right

            if smallest != current:
                self._swap(current, smallest)
                current = smallest
            else:
                break

    def push(self, score: float, place: TouristPlace, breakdown: Dict[str, float]) -> None:
        """
        Pushes a new candidate into the bounded Top-K heap.
        If heap size < K: appends and sifts up (O(log K)).
        If heap size == K and score > min root: replaces root and sifts down (O(log K)).
        Otherwise: ignores candidate (O(1)).
        """
        node = HeapNode(score, place, breakdown)

        if len(self.heap) < self.k:
            self.heap.append(node)
            self._sift_up(len(self.heap) - 1)
        else:
            # If candidate score is greater than the current minimum in Top-K
            if self.heap[0] < node:
                self.heap[0] = node
                self._sift_down(0)

    def extract_min(self) -> Optional[HeapNode]:
        """Removes and returns the minimum element from the heap. O(log K)."""
        if self.is_empty():
            return None
        root = self.heap[0]
        last_node = self.heap.pop()
        if not self.is_empty():
            self.heap[0] = last_node
            self._sift_down(0)
        return root

    def get_top_k_sorted(self) -> List[Tuple[TouristPlace, float, Dict[str, float]]]:
        """
        Returns all elements currently in the heap sorted in DESCENDING order of score.
        Uses in-place heap sort logic without destroying the original heap.
        Time Complexity: O(K log K).
        """
        # Create a copy of heap references to sort without modifying active structure
        copy_nodes = list(self.heap)
        
        # Hand-crafted in-place HeapSort on copy_nodes
        # Note: In our min-heap, extracting min repeatedly gives ascending order.
        # Reversing that yields descending order (Rank 1 to Rank K).
        ascending = []
        temp_heap = TopKHeap(self.k)
        temp_heap.heap = list(self.heap)
        
        while not temp_heap.is_empty():
            ascending.append(temp_heap.extract_min())

        descending = []
        for node in reversed(ascending):
            descending.append((node.place, node.score, node.breakdown))
        
        return descending


# ==============================================================================
# 3. HAND-BUILT DATA STRUCTURE 2: TRIE FOR PREFIX / AUTOCOMPLETE SEARCH
# ==============================================================================

class TrieNode:
    """
    Node in the Trie data structure.
    Holds child character links and list of tourist place IDs that match this prefix.
    """
    def __init__(self):
        self.children: Dict[str, 'TrieNode'] = {}
        self.place_ids: List[int] = []  # Stores matching place IDs
        self.is_end_of_word: bool = False


class Trie:
    """
    CUSTOM TRIE (PREFIX SEARCH TREE) BUILT ENTIRELY BY HAND.
    No third-party search indexes or regex.
    
    Why Trie for Tourist Place Search?
    - Provides instant O(L) prefix search, where L is the length of search prefix.
    - Completely independent of dataset size N (avoids full table scan O(N)).
    - Enables real-time autocomplete as the tourist types characters into the UI.
    - Also indexes individual category and feature tags (e.g., 'temple', 'trekking', 'heritage').
    """

    def __init__(self):
        self.root = TrieNode()

    def insert(self, phrase: str, place_id: int) -> None:
        """
        Inserts a normalized string into the Trie, linking it to the place_id.
        Time Complexity: O(L) where L = len(phrase).
        """
        phrase = phrase.strip().lower()
        if not phrase:
            return

        current = self.root
        for char in phrase:
            if char not in current.children:
                current.children[char] = TrieNode()
            current = current.children[char]
            # Avoid duplicate IDs at the same node
            if place_id not in current.place_ids:
                current.place_ids.append(place_id)
        current.is_end_of_word = True

    def search_prefix(self, prefix: str) -> List[int]:
        """
        Finds all place IDs matching the given prefix.
        Time Complexity: O(L) where L = len(prefix).
        """
        prefix = prefix.strip().lower()
        if not prefix:
            return []

        current = self.root
        for char in prefix:
            if char not in current.children:
                return []  # Prefix does not exist
            current = current.children[char]

        return list(current.place_ids)


# ==============================================================================
# 4. UNIFIED ENGINE 2 COORDINATOR: SEARCH & RANKING SYSTEM
# ==============================================================================

class SearchAndRankingEngine:
    """
    The master Engine 2 class integrating:
    1. Fast Trie-based prefix retrieval.
    2. Multi-attribute filtering (category, city, budget).
    3. Multi-criteria composite scoring rule.
    4. Custom Top-K Heap extraction.
    """

    def __init__(self):
        self.places: Dict[int, TouristPlace] = {}
        self.name_trie = Trie()
        self.tag_trie = Trie()

    def add_place(self, place: TouristPlace) -> None:
        """Registers a tourist place into storage and indexes."""
        self.places[place.place_id] = place

        # Index primary name
        self.name_trie.insert(place.name, place.place_id)

        # Index words within the name
        for word in place.name.split():
            self.name_trie.insert(word, place.place_id)

        # Index city and category
        self.name_trie.insert(place.city, place.place_id)
        self.tag_trie.insert(place.category, place.place_id)

        # Index tags
        for tag in place.tags:
            self.tag_trie.insert(tag, place.place_id)

    def bulk_load(self, places_list: List[TouristPlace]) -> None:
        """Loads a collection of places into the engine."""
        for place in places_list:
            self.add_place(place)

    def autocomplete(self, prefix: str, max_suggestions: int = 5) -> List[str]:
        """Provides instant query autocompletion suggestions."""
        matched_ids = self.name_trie.search_prefix(prefix)
        suggestions = []
        for pid in matched_ids[:max_suggestions]:
            suggestions.append(self.places[pid].name)
        return suggestions

    def search_and_rank(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        city: Optional[str] = None,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
        user_budget: Optional[float] = None,
        current_season: Optional[str] = None,
        top_k: int = 10,
        custom_weights: Optional[Dict[str, float]] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes the complete Search & Ranking Pipeline:
        Step 1: Candidate Generation (Trie lookup or full catalogue if query is empty).
        Step 2: Hard Filtering (Category, City, Hard Budget constraints).
        Step 3: Multi-Criteria Scoring (ScoringRule calculation).
        Step 4: Top-K Heap Extraction (TopKHeap custom min-heap).
        
        Returns: Top-K ranked places formatted for Engine 3 API / Web UI.
        """
        # Step 1: Candidate Generation
        if query and query.strip():
            q = query.strip().lower()
            name_matches = set(self.name_trie.search_prefix(q))
            tag_matches = set(self.tag_trie.search_prefix(q))
            candidate_ids = name_matches.union(tag_matches)
        else:
            candidate_ids = set(self.places.keys())

        if not candidate_ids:
            return []

        # Step 2: Initialize Bounded Top-K Min-Heap
        heap = TopKHeap(k=top_k)

        # Step 3: Filter & Score Candidates
        for pid in candidate_ids:
            place = self.places[pid]

            # Hard filter on category if specified
            if category and category.lower() != "all":
                if place.category.lower() != category.strip().lower():
                    continue

            # Hard filter on city if specified
            if city and city.lower() != "all":
                if place.city.lower() != city.strip().lower():
                    continue

            # Compute Score via Rule
            score, breakdown = ScoringRule.compute_composite_score(
                place=place,
                user_lat=user_lat,
                user_lon=user_lon,
                user_budget=user_budget,
                current_season=current_season,
                weights=custom_weights
            )

            # Insert into Custom Bounded Heap
            heap.push(score=score, place=place, breakdown=breakdown)

        # Step 4: Extract Descending Top-K
        top_k_results = heap.get_top_k_sorted()

        # Format output
        ranked_output = []
        for rank, (place, score, breakdown) in enumerate(top_k_results, start=1):
            item = place.to_dict()
            item["rank"] = rank
            item["composite_score"] = score
            item["score_breakdown"] = breakdown
            ranked_output.append(item)

        return ranked_output
