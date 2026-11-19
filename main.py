"""
====================================================================================================
KLE TECHNOLOGICAL UNIVERSITY, HUBBALLI
DEPARTMENT OF BACHELOR OF COMPUTER APPLICATIONS
THEME 3 / THEME 4: SEARCH AND RANKING SYSTEM

ENGINE 2: LOGIC & RULE (DATA STRUCTURES & PROGRAMMING)
Student: Vivek B M (USN: 01FE24BCA266)
REST API HTTP SERVER (Zero external dependencies)
====================================================================================================
"""

import sys
import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from engine2_backend import RankingEngine, RankingWeights, get_karnataka_dataset, CustomMaxHeap

PORT = 5000
dataset = get_karnataka_dataset()
engine = RankingEngine()
engine.load_catalog(dataset)

categories = [
    {"category_id": 1, "category_name": "Beach"},
    {"category_id": 2, "category_name": "Historical"},
    {"category_id": 3, "category_name": "Nature"},
    {"category_id": 4, "category_name": "Temple"},
    {"category_id": 5, "category_name": "Wildlife"},
    {"category_id": 6, "category_name": "Hill Station"}
]

audit_logs = [
    {"audit_id": 1, "place_id": 9, "action_type": "UPDATE_ENTRY_FEE", "old_entry_fee": 30.0, "new_entry_fee": 35.0, "old_rating": 4.5, "new_rating": 4.5, "performed_by": "SYSTEM_ADMIN"},
    {"audit_id": 2, "place_id": 16, "action_type": "UPDATE_RATING", "old_entry_fee": 50.0, "new_entry_fee": 50.0, "old_rating": 4.9, "new_rating": 4.95, "performed_by": "SYSTEM_ADMIN"}
]

class Engine2RequestHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == '/' or path == '/api/health':
            self._send_json(200, {
                "status": "ONLINE",
                "engine": "Engine 2: Logic & Rule",
                "course_area": "Data Structures & Programming",
                "student": "Vivek B M (USN: 01FE24BCA266)",
                "dataset_size": len(dataset),
                "formula": "Score = (w1*Rating_norm) + (w2*Pop_norm) + (w3*PrefMatch) + (w4*Proximity_norm)",
                "hand_built_structure": "Custom Binary Max-Heap (Priority Queue)"
            })
            return

        if path == '/api/categories':
            self._send_json(200, {"categories": categories})
            return

        if path == '/api/places':
            q = query.get('q', [''])[0].strip().lower()
            places = dataset
            if q:
                places = [p for p in places if q in p['place_name'].lower() or q in p['city'].lower()]
            self._send_json(200, {"count": len(places), "places": places})
            return

        if path == '/api/places/autocomplete':
            q = query.get('q', [''])[0].strip().lower()
            if not q:
                self._send_json(200, {"suggestions": []})
                return
            suggestions = [
                {"place_id": p['place_id'], "place_name": p['place_name'], "city": p['city'], "category_name": p.get('category_name', '')}
                for p in dataset if q in p['place_name'].lower() or q in p['city'].lower()
            ][:8]
            self._send_json(200, {"suggestions": suggestions})
            return

        if path == '/api/audit-logs':
            self._send_json(200, {"count": len(audit_logs), "audit_logs": audit_logs})
            return

        self._send_json(404, {"error": f"Endpoint not found: {path}"})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_length)
        try:
            body = json.loads(body_bytes.decode('utf-8')) if body_bytes else {}
        except Exception:
            self._send_json(400, {"error": "Malformed JSON payload"})
            return

        if path == '/api/rank':
            keyword = body.get('keyword', '').strip()
            cat_id = int(body.get('category_id') or body.get('preferredCategory') or 0)
            budget = float(body.get('max_budget') if body.get('max_budget') is not None else body.get('budget', -1))
            distance = float(body.get('max_distance') if body.get('max_distance') is not None else body.get('distance', -1))
            min_rating = float(body.get('min_rating') if body.get('min_rating') is not None else body.get('minRating', 0))
            top_k = int(body.get('top_k') or body.get('limit') or 10)
            sort_by = (body.get('sort_by') or body.get('sortBy') or 'score').lower()

            raw_w = body.get('weights', {})
            try:
                w1 = float(raw_w.get('wRating', 0.40))
                w2 = float(raw_w.get('wPopularity', 0.30))
                w3 = float(raw_w.get('wPreference', 0.20))
                w4 = float(raw_w.get('wDistance', 0.10))
                weights = RankingWeights(w1, w2, w3, w4)
            except ValueError as ve:
                self._send_json(400, {"error": str(ve)})
                return

            req_engine = RankingEngine(weights)
            req_engine.load_catalog(dataset)

            # Filtering
            candidates = []
            for p in dataset:
                if budget >= 0 and p['entry_fee'] > budget:
                    continue
                if distance > 0 and p['distance_km'] > distance:
                    continue
                if min_rating > 0 and p['rating'] < min_rating:
                    continue
                if keyword:
                    kw = keyword.lower()
                    if not (kw in p['place_name'].lower() or kw in p['city'].lower() or kw in p['description'].lower()):
                        continue
                scored = dict(p)
                calc = req_engine.compute_score(scored, cat_id)
                scored['composite_score'] = calc['composite_score']
                scored['breakdown'] = calc['breakdown']
                candidates.append(scored)

            if sort_by == 'rating':
                ranked = sorted(candidates, key=lambda x: x['rating'], reverse=True)[:top_k]
            elif sort_by == 'distance':
                ranked = sorted(candidates, key=lambda x: x['distance_km'])[:top_k]
            elif sort_by == 'fee':
                ranked = sorted(candidates, key=lambda x: x['entry_fee'])[:top_k]
            else:
                heap = CustomMaxHeap()
                heap.build_heap(candidates)
                ranked = heap.get_top_k(top_k)

            self._send_json(200, {
                "metadata": {
                    "algorithm": "CustomMaxHeap (Hand-built Priority Queue)",
                    "candidate_pool_size": len(candidates),
                    "top_k_requested": top_k,
                    "returned_count": len(ranked),
                    "weights_applied": weights.to_dict()
                },
                "results": ranked
            })
            return

        self._send_json(404, {"error": f"Endpoint not found: {path}"})

if __name__ == '__main__':
    if '--cli' in sys.argv:
        print("Running CLI demo...")
        top5 = engine.search_and_rank(top_k=5)
        for i, p in enumerate(top5):
            print(f"{i+1}. {p['place_name']} - Score: {p['composite_score']}")
    else:
        server = HTTPServer(('0.0.0.0', PORT), Engine2RequestHandler)
        print("=" * 64)
        print("  KLE TECHNOLOGICAL UNIVERSITY - DEPARTMENT OF BCA")
        print("  ENGINE 2: LOGIC & RULE (DATA STRUCTURES & PROGRAMMING)")
        print(f"  REST API HTTP Server running on http://localhost:{PORT}")
        print("  Press Ctrl+C to stop.")
        print("=" * 64)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
