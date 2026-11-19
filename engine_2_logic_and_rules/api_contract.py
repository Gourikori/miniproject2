"""
================================================================================
KLE TECHNOLOGICAL UNIVERSITY
Theme: Search and Ranking System
Project: Tourist Place Search and Ranking System
ENGINE 2: Inter-Engine Integration Contract & Adapter
================================================================================
Specifies the exact data interface between:
- Engine 1 (Database Management System): Data Ingestion Contract
- Engine 2 (Logic & Rule): Ranking & Search Algorithm
- Engine 3 (Web Technologies): REST API Endpoints / Request-Response Schema
- Engine 4 (Software Engineering & Testing): Invariant Assertions & Auditing
================================================================================
"""

from typing import Dict, Any, List, Optional
from ranking_engine import TouristPlace, SearchAndRankingEngine


class Engine2Service:
    """
    Service layer exposing clean callable interfaces for Engine 3 (Web / API)
    and ingesting raw database rows from Engine 1 (DBMS).
    """

    def __init__(self):
        self.engine = SearchAndRankingEngine()

    def sync_from_database(self, db_rows: List[Dict[str, Any]]) -> int:
        """
        CONTRACT WITH ENGINE 1 (Data & Integrity):
        Accepts records retrieved from the relational database (PostgreSQL/MySQL/SQLite).
        Validates data integrity before populating in-memory Trie and Heap indexes.
        
        Expected fields per row:
        - id / place_id (int, Primary Key)
        - name (str, NOT NULL)
        - category (str, NOT NULL)
        - city (str, NOT NULL)
        - latitude (float, NOT NULL, -90 to 90)
        - longitude (float, NOT NULL, -180 to 180)
        - avg_rating (float, 0.0 to 5.0)
        - review_count (int, >= 0)
        - entry_fee (float, >= 0)
        - recommended_season (str)
        - popularity_tier (int, 1 to 5)
        - tags (list of str or comma-separated str)
        """
        loaded_count = 0
        for row in db_rows:
            tags = row.get("tags", [])
            if isinstance(tags, str):
                tags = [t.strip() for t in tags.split(",") if t.strip()]

            place = TouristPlace(
                place_id=row.get("place_id") or row.get("id"),
                name=row["name"],
                category=row.get("category", "General"),
                city=row.get("city", "Unknown"),
                latitude=float(row["latitude"]),
                longitude=float(row["longitude"]),
                avg_rating=float(row.get("avg_rating", 3.5)),
                review_count=int(row.get("review_count", 0)),
                entry_fee=float(row.get("entry_fee", 0.0)),
                recommended_season=row.get("recommended_season", "All"),
                popularity_tier=int(row.get("popularity_tier", 3)),
                tags=tags
            )
            self.engine.add_place(place)
            loaded_count += 1
            
        return loaded_count

    def handle_search_request(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        CONTRACT WITH ENGINE 3 (Interface & Access):
        Handles HTTP GET /api/search parameters sent from Web UI.
        
        Input params:
            - q: search query string (optional)
            - category: category filter (optional)
            - city: city filter (optional)
            - lat, lon: user GPS coordinates (optional)
            - budget: maximum budget in INR (optional)
            - season: current season (e.g., 'Winter') (optional)
            - limit / top_k: number of results (default 10)
            
        Returns JSON-serializable dictionary.
        """
        query = params.get("q")
        category = params.get("category")
        city = params.get("city")
        
        user_lat = float(params["lat"]) if "lat" in params and params["lat"] is not None else None
        user_lon = float(params["lon"]) if "lon" in params and params["lon"] is not None else None
        user_budget = float(params["budget"]) if "budget" in params and params["budget"] is not None else None
        season = params.get("season")
        top_k = int(params.get("limit", 10))

        # Invoke core Engine 2 logic
        ranked_places = self.engine.search_and_rank(
            query=query,
            category=category,
            city=city,
            user_lat=user_lat,
            user_lon=user_lon,
            user_budget=user_budget,
            current_season=season,
            top_k=top_k
        )

        return {
            "status": "success",
            "count": len(ranked_places),
            "filters_applied": {
                "query": query,
                "category": category,
                "city": city,
                "user_lat": user_lat,
                "user_lon": user_lon,
                "user_budget": user_budget,
                "season": season,
                "top_k": top_k
            },
            "data": ranked_places
        }

    def handle_autocomplete_request(self, prefix: str) -> Dict[str, Any]:
        """
        CONTRACT WITH ENGINE 3 (Interface & Access):
        Handles real-time autocomplete requests from frontend search bar.
        """
        suggestions = self.engine.autocomplete(prefix=prefix, max_suggestions=8)
        return {
            "status": "success",
            "prefix": prefix,
            "suggestions": suggestions
        }
