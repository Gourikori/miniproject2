"""
================================================================================
KLE TECHNOLOGICAL UNIVERSITY
Theme: Search and Ranking System
Project: Tourist Place Search and Ranking System
ENGINE 2: Unit Test Suite
Member 2 Verification & Validation (Integrates with Engine 4 SDLC Testing)
================================================================================
"""

import unittest
import math
from ranking_engine import TouristPlace, ScoringRule, TopKHeap, Trie, SearchAndRankingEngine


class TestScoringRule(unittest.TestCase):
    """Verifies all mathematical rules, edge cases, and bounds."""

    def setUp(self):
        self.sample_place = TouristPlace(
            place_id=101,
            name="Test Sanctuary",
            category="Wildlife",
            city="Dharwad",
            latitude=15.4589,
            longitude=75.0078,
            avg_rating=4.5,
            review_count=100,
            entry_fee=50.0,
            recommended_season="Winter",
            popularity_tier=4,
            tags=["forest", "birds"]
        )

    def test_bayesian_rating_bounds(self):
        # Case 1: Standard place
        score = ScoringRule.calculate_bayesian_rating(4.5, 100)
        self.assertTrue(0.0 <= score <= 100.0)

        # Case 2: Zero reviews should return global mean (3.5 -> ((3.5-1)/4)*100 = 62.5)
        score_zero = ScoringRule.calculate_bayesian_rating(5.0, 0)
        self.assertAlmostEqual(score_zero, 62.5, places=1)

        # Case 3: Out-of-bounds ratings should be clamped safely
        score_clamped = ScoringRule.calculate_bayesian_rating(10.0, 500)
        self.assertTrue(score_clamped <= 100.0)

    def test_haversine_and_distance_decay(self):
        # Zero distance must give score 100.0
        dist_zero = ScoringRule.haversine_distance(15.0, 75.0, 15.0, 75.0)
        self.assertAlmostEqual(dist_zero, 0.0, places=3)
        self.assertEqual(ScoringRule.calculate_distance_score(0.0), 100.0)

        # Known distance between Hubballi (15.3647, 75.1240) and Dharwad (15.4589, 75.0078) ~16-17 km
        dist = ScoringRule.haversine_distance(15.3647, 75.1240, 15.4589, 75.0078)
        self.assertTrue(15.0 <= dist <= 20.0)

        # Distance decay must be strictly decreasing with distance
        s_close = ScoringRule.calculate_distance_score(10.0)
        s_far = ScoringRule.calculate_distance_score(150.0)
        self.assertTrue(s_close > s_far)

    def test_budget_scoring(self):
        # Free entry should always receive 100.0
        self.assertEqual(ScoringRule.calculate_budget_score(0.0, 200.0), 100.0)
        
        # Fee within budget
        score_affordable = ScoringRule.calculate_budget_score(50.0, 200.0)
        score_expensive = ScoringRule.calculate_budget_score(500.0, 200.0)
        self.assertTrue(score_affordable > score_expensive)

    def test_composite_score_invariants(self):
        # Final composite score must never violate [0.0, 100.0]
        final_score, breakdown = ScoringRule.compute_composite_score(
            place=self.sample_place,
            user_lat=15.3647,
            user_lon=75.1240,
            user_budget=100.0,
            current_season="Winter"
        )
        self.assertTrue(0.0 <= final_score <= 100.0)
        self.assertIn("bayesian_rating", breakdown)
        self.assertIn("distance", breakdown)
        self.assertIn("budget", breakdown)


class TestTopKHeap(unittest.TestCase):
    """Verifies hand-built bounded Min-Heap implementation."""

    def test_top_k_extraction_correctness(self):
        k = 3
        heap = TopKHeap(k=k)
        dummy_breakdown = {}

        # Insert 6 elements with known scores
        scores = [45.0, 85.0, 12.0, 95.0, 60.0, 78.0]
        for idx, s in enumerate(scores):
            p = TouristPlace(idx, f"P_{idx}", "C", "City", 0, 0, 4, 10, 0, "All", 3)
            heap.push(s, p, dummy_breakdown)

        self.assertEqual(heap.size(), k)

        top_k = heap.get_top_k_sorted()
        extracted_scores = [item[1] for item in top_k]

        # The top 3 scores out of [45, 85, 12, 95, 60, 78] are [95.0, 85.0, 78.0]
        expected_scores = [95.0, 85.0, 78.0]
        self.assertEqual(extracted_scores, expected_scores)

    def test_duplicate_and_tie_breaking(self):
        k = 2
        heap = TopKHeap(k=k)
        p1 = TouristPlace(1, "Place A", "C", "City", 0, 0, 4, 100, 0, "All", 3)
        p2 = TouristPlace(2, "Place B", "C", "City", 0, 0, 4, 500, 0, "All", 3)

        # Equal scores; higher review count should break tie or both be safely retained
        heap.push(80.0, p1, {})
        heap.push(80.0, p2, {})
        self.assertEqual(heap.size(), 2)

    def test_invalid_k_raises_error(self):
        with self.assertRaises(ValueError):
            TopKHeap(k=0)
        with self.assertRaises(ValueError):
            TopKHeap(k=-5)


class TestTriePrefixSearch(unittest.TestCase):
    """Verifies hand-built Trie prefix search."""

    def setUp(self):
        self.trie = Trie()
        self.trie.insert("Hampi", 1)
        self.trie.insert("Heritage", 1)
        self.trie.insert("Badami", 2)
        self.trie.insert("Bangalore", 3)

    def test_exact_and_prefix_matches(self):
        # Prefix "ha" should match Hampi (id 1)
        res_ha = self.trie.search_prefix("ha")
        self.assertIn(1, res_ha)

        # Prefix "ba" should match Badami (id 2) and Bangalore (id 3)
        res_ba = self.trie.search_prefix("ba")
        self.assertEqual(set(res_ba), {2, 3})

    def test_case_insensitivity(self):
        res_upper = self.trie.search_prefix("HAM")
        self.assertEqual(res_upper, [1])

    def test_non_existent_prefix(self):
        res_none = self.trie.search_prefix("xyz")
        self.assertEqual(res_none, [])


if __name__ == "__main__":
    unittest.main()
