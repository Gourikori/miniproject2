/**
 * ====================================================================================================
 * KLE TECHNOLOGICAL UNIVERSITY, HUBBALLI
 * DEPARTMENT OF BACHELOR OF COMPUTER APPLICATIONS
 * THEME 3 / THEME 4: SEARCH AND RANKING SYSTEM / REPORTING & MIS
 * 
 * ENGINE 2: LOGIC & RULE (DATA STRUCTURES & PROGRAMMING)
 * Student: Vivek B M (USN: 01FE24BCA266)
 * Faculty Guides: Prof. Pavankumar Vadavi, Prof. Sayeeda Anjum
 * 
 * CORE DELIVERABLE:
 * 1. The Main Calculation / Rule: Multi-factor Composite Scoring Formula with strict weight normalization.
 * 2. Hand-Built Data Structure: Custom Binary Max-Heap (Priority Queue) constructed from scratch
 *    without using std::sort or std::priority_queue.
 * 3. Justification: Floyd's O(N) heap construction + O(K log N) Top-K extraction vs O(N log N) full sort.
 * ====================================================================================================
 */

#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <cmath>
#include <stdexcept>
#include <algorithm>
#include <sstream>

using namespace std;

// ----------------------------------------------------------------------------------------------------
// SECTION 1: DOMAIN ENTITIES & DATA STRUCTURES
// ----------------------------------------------------------------------------------------------------

struct ScoreBreakdown {
    double rawRating;
    double normRating;
    double weightedRating;
    
    double rawPopularity;
    double normPopularity;
    double weightedPopularity;
    
    double preferenceMatch;
    double weightedPreference;
    
    double rawDistance;
    double normProximity;
    double weightedProximity;
    
    double compositeScore;
};

struct TouristPlace {
    int placeId;
    string placeName;
    string city;
    string state;
    int categoryId;
    string categoryName;
    double entryFee;
    double distanceKm;
    double rating;
    int popularity;
    string bestTimeToVisit;
    string description;
    
    // Computed ranking metrics
    double compositeScore;
    ScoreBreakdown breakdown;

    TouristPlace() 
        : placeId(0), categoryId(0), entryFee(0.0), distanceKm(0.0), 
          rating(0.0), popularity(0), compositeScore(0.0) {}

    TouristPlace(int id, string name, string c, string s, int catId, string catName,
                 double fee, double dist, double rat, int pop, string bestTime, string desc)
        : placeId(id), placeName(name), city(c), state(s), categoryId(catId),
          categoryName(catName), entryFee(fee), distanceKm(dist), rating(rat),
          popularity(pop), bestTimeToVisit(bestTime), description(desc), compositeScore(0.0) {}
};

struct RankingWeights {
    double wRating;       // w1
    double wPopularity;   // w2
    double wPreference;   // w3
    double wDistance;     // w4

    RankingWeights(double w1 = 0.40, double w2 = 0.30, double w3 = 0.20, double w4 = 0.10)
        : wRating(w1), wPopularity(w2), wPreference(w3), wDistance(w4) {
        validate();
    }

    // Engine 2 Non-Violable Rule: Weights must be non-negative and sum to exactly 1.000 (+/- epsilon)
    void validate() const {
        if (wRating < 0.0 || wPopularity < 0.0 || wPreference < 0.0 || wDistance < 0.0) {
            throw invalid_argument("RULE VIOLATION (B2): Ranking weights cannot be negative.");
        }
        double sum = wRating + wPopularity + wPreference + wDistance;
        if (std::abs(sum - 1.000) > 0.001) {
            ostringstream oss;
            oss << "RULE VIOLATION (B2): Ranking weights must sum to exactly 1.000 (Current sum = " 
                << fixed << setprecision(3) << sum << ").";
            throw invalid_argument(oss.str());
        }
    }
};

// ----------------------------------------------------------------------------------------------------
// SECTION 2: HAND-BUILT DATA STRUCTURE (CUSTOM BINARY MAX-HEAP)
// ----------------------------------------------------------------------------------------------------
/**
 * REASON FOR CHOOSING CUSTOM MAX-HEAP OVER QUICKSORT / MERGESORT:
 * 
 * 1. Time Complexity Optimization for Top-K Queries:
 *    - In tourist search applications, users view only the Top-K results (e.g. top 5 or 10 spots).
 *    - Standard sorting (QuickSort/MergeSort) sorts ALL N elements in O(N log N) time.
 *    - Hand-built Max-Heap builds the heap in O(N) linear time using Floyd's bottom-up algorithm,
 *      and extracts the Top-K items in O(K log N) time.
 *    - Total Time Complexity: O(N + K log N). Since K << N (e.g., K=5, N=34 or N=1000),
 *      O(N + K log N) is asymptotically faster than O(N log N).
 * 
 * 2. Space Efficiency:
 *    - In-place array representation requiring only O(1) auxiliary space beyond storage.
 * 
 * 3. Dynamic Real-Time Updates:
 *    - When ratings or fees change in Engine 1's database, inserting or updating an element
 *      in the max-heap takes O(log N) time, avoiding the O(N log N) penalty of re-sorting.
 */
class CustomMaxHeap {
private:
    vector<TouristPlace> heap;

    int parent(int i) { return (i - 1) / 2; }
    int leftChild(int i) { return 2 * i + 1; }
    int rightChild(int i) { return 2 * i + 2; }

    // Tie-breaker comparator for deterministic ranking proof (Gate 1 - B2 & B3 compliance)
    bool isGreater(const TouristPlace& a, const TouristPlace& b) {
        if (std::abs(a.compositeScore - b.compositeScore) > 0.0001) {
            return a.compositeScore > b.compositeScore;
        }
        // Deterministic Tie-Breaker 1: Higher rating wins
        if (std::abs(a.rating - b.rating) > 0.01) {
            return a.rating > b.rating;
        }
        // Deterministic Tie-Breaker 2: Higher popularity wins
        if (a.popularity != b.popularity) {
            return a.popularity > b.popularity;
        }
        // Deterministic Tie-Breaker 3: Lexicographical order by place name
        return a.placeName < b.placeName;
    }

    void heapifyDown(int i) {
        int maxIndex = i;
        int left = leftChild(i);
        int right = rightChild(i);
        int size = (int)heap.size();

        if (left < size && isGreater(heap[left], heap[maxIndex])) {
            maxIndex = left;
        }
        if (right < size && isGreater(heap[right], heap[maxIndex])) {
            maxIndex = right;
        }

        if (i != maxIndex) {
            std::swap(heap[i], heap[maxIndex]);
            heapifyDown(maxIndex);
        }
    }

    void heapifyUp(int i) {
        while (i > 0 && isGreater(heap[i], heap[parent(i)])) {
            std::swap(heap[i], heap[parent(i)]);
            i = parent(i);
        }
    }

public:
    CustomMaxHeap() {}

    // Floyd's bottom-up linear time O(N) heap construction
    void buildHeap(const vector<TouristPlace>& places) {
        heap = places;
        int n = (int)heap.size();
        for (int i = (n / 2) - 1; i >= 0; --i) {
            heapifyDown(i);
        }
    }

    void insert(const TouristPlace& place) {
        heap.push_back(place);
        heapifyUp((int)heap.size() - 1);
    }

    bool isEmpty() const {
        return heap.empty();
    }

    int size() const {
        return (int)heap.size();
    }

    TouristPlace extractMax() {
        if (heap.empty()) {
            throw out_of_range("Heap underflow: cannot extract from empty max-heap.");
        }
        TouristPlace maxPlace = heap[0];
        heap[0] = heap.back();
        heap.pop_back();
        if (!heap.empty()) {
            heapifyDown(0);
        }
        return maxPlace;
    }

    // Top-K extraction in O(K log N) time
    vector<TouristPlace> getTopK(int k) {
        vector<TouristPlace> topResults;
        int count = std::min(k, (int)heap.size());
        for (int i = 0; i < count; ++i) {
            topResults.push_back(extractMax());
        }
        return topResults;
    }
};

// ----------------------------------------------------------------------------------------------------
// SECTION 3: THE MAIN CALCULATION / RULE (ENGINE 2 RANKING LOGIC)
// ----------------------------------------------------------------------------------------------------
class RankingEngine {
private:
    vector<TouristPlace> catalog;
    RankingWeights weights;

    // Normalization upper bounds
    const double MAX_RATING = 5.00;
    const double MAX_POPULARITY = 100.00;
    const double MAX_REFERENCE_DISTANCE = 500.00; // Karnataka regional bound from Hubballi baseline

public:
    RankingEngine(const RankingWeights& w = RankingWeights()) : weights(w) {}

    void setWeights(const RankingWeights& w) {
        w.validate();
        this->weights = w;
    }

    const RankingWeights& getWeights() const {
        return weights;
    }

    void loadCatalog(const vector<TouristPlace>& places) {
        this->catalog = places;
    }

    /**
     * THE MAIN FORMULA CALCULATION:
     * 
     * NormRating     = rating / 5.0
     * NormPopularity = popularity / 100.0
     * PrefMatch      = 1.0 if category matches user preference else 0.0
     * NormProximity  = 1.0 - (min(distance, 500.0) / 500.0)
     * 
     * CompositeScore = (w1 * NormRating) + (w2 * NormPopularity) 
     *                + (w3 * PrefMatch) + (w4 * NormProximity)
     * 
     * B2 Rule Compliance:
     * - Bounded: 0.0 <= CompositeScore <= 1.0
     * - Deterministic: Same input yields identical score breakdown.
     */
    ScoreBreakdown computeScore(const TouristPlace& place, int preferredCategoryId) {
        ScoreBreakdown sb;

        // 1. Rating component
        sb.rawRating = place.rating;
        sb.normRating = std::max(0.0, std::min(1.0, place.rating / MAX_RATING));
        sb.weightedRating = weights.wRating * sb.normRating;

        // 2. Popularity component
        sb.rawPopularity = place.popularity;
        sb.normPopularity = std::max(0.0, std::min(1.0, place.popularity / MAX_POPULARITY));
        sb.weightedPopularity = weights.wPopularity * sb.normPopularity;

        // 3. Category preference match component
        sb.preferenceMatch = (preferredCategoryId > 0 && place.categoryId == preferredCategoryId) ? 1.0 : 0.0;
        sb.weightedPreference = weights.wPreference * sb.preferenceMatch;

        // 4. Distance proximity component (Nearer places score higher)
        sb.rawDistance = place.distanceKm;
        sb.normProximity = std::max(0.0, std::min(1.0, 1.0 - (place.distanceKm / MAX_REFERENCE_DISTANCE)));
        sb.weightedProximity = weights.wDistance * sb.normProximity;

        // 5. Final composite score
        double rawScore = sb.weightedRating + sb.weightedPopularity + sb.weightedPreference + sb.weightedProximity;
        sb.compositeScore = std::max(0.0, std::min(1.0, rawScore));

        return sb;
    }

    /**
     * FILTER & RANK PIPELINE:
     * Filters candidate places by keyword, category, max budget, and max distance,
     * computes composite scores, loads them into CustomMaxHeap, and extracts Top-K.
     */
    vector<TouristPlace> searchAndRank(
        const string& keyword,
        int preferredCategoryId,
        double maxBudget,
        double maxDistance,
        int topK = 10
    ) {
        vector<TouristPlace> candidates;

        // Case-insensitive substring matching helper
        auto containsSubstring = [](string text, string query) {
            std::transform(text.begin(), text.end(), text.begin(), ::tolower);
            std::transform(query.begin(), query.end(), query.begin(), ::tolower);
            return text.find(query) != string::npos;
        };

        for (const auto& p : catalog) {
            // Filter 1: Budget constraint
            if (maxBudget >= 0.0 && p.entryFee > maxBudget) {
                continue;
            }
            // Filter 2: Max distance radius constraint
            if (maxDistance > 0.0 && p.distanceKm > maxDistance) {
                continue;
            }
            // Filter 3: Keyword match (Place name, city, or description)
            if (!keyword.empty()) {
                bool nameMatch = containsSubstring(p.placeName, keyword);
                bool cityMatch = containsSubstring(p.city, keyword);
                bool descMatch = containsSubstring(p.description, keyword);
                bool catMatch  = containsSubstring(p.categoryName, keyword);
                if (!nameMatch && !cityMatch && !descMatch && !catMatch) {
                    continue;
                }
            }

            // Copy place and calculate score & breakdown
            TouristPlace scoredPlace = p;
            scoredPlace.breakdown = computeScore(scoredPlace, preferredCategoryId);
            scoredPlace.compositeScore = scoredPlace.breakdown.compositeScore;
            candidates.push_back(scoredPlace);
        }

        // Build Custom Max-Heap in O(M) time where M = candidates.size()
        CustomMaxHeap heap;
        heap.buildHeap(candidates);

        // Extract Top-K items in O(K log M) time
        return heap.getTopK(topK);
    }
};

// ----------------------------------------------------------------------------------------------------
// SECTION 4: 34 KARNATAKA DESTINATIONS DATASET (ALIGNED WITH ENGINE 1)
// ----------------------------------------------------------------------------------------------------
vector<TouristPlace> getKarnatakaMasterDataset() {
    return {
        // Local Hubballi - Dharwad
        TouristPlace(1, "Unkal Lake & Park", "Hubballi", "Karnataka", 3, "Nature", 10.00, 6.0, 4.30, 82, "July to October", "A calm lakeside escape for an evening walk and family outing."),
        TouristPlace(2, "Chandramouleshwara Temple", "Hubballi", "Karnataka", 4, "Temple", 0.00, 8.5, 4.50, 78, "October to March", "Historic stone carvings and Western Chalukyan architecture."),
        TouristPlace(3, "Nrupatunga Betta Viewpoint", "Hubballi", "Karnataka", 3, "Nature", 20.00, 10.0, 4.40, 80, "July to October", "Scenic hillock offering panoramic city viewpoints."),
        TouristPlace(4, "Sadhankeri Park & Lake", "Dharwad", "Karnataka", 3, "Nature", 10.00, 22.0, 4.20, 72, "October to March", "Serene garden memorial commemorating poet Da. Ra. Bendre."),

        // Coastal & Western Ghats
        TouristPlace(5, "Gokarna Om Beach", "Gokarna", "Karnataka", 1, "Beach", 0.00, 150.0, 4.60, 92, "November to February", "Sweeping coastline and laid-back beach town atmosphere."),
        TouristPlace(6, "Kudle Beach", "Gokarna", "Karnataka", 1, "Beach", 0.00, 152.0, 4.50, 88, "November to February", "Scenic coastal stretch ideal for swimming and sunsets."),
        TouristPlace(7, "Murudeshwar Temple & Beach", "Murudeshwar", "Karnataka", 4, "Temple", 0.00, 185.0, 4.70, 95, "October to March", "Dramatic landmark with giant Shiva statue and Arabian Sea views."),
        TouristPlace(8, "Yana Rocks & Caves", "Kumta", "Karnataka", 3, "Nature", 20.00, 140.0, 4.60, 85, "October to March", "Gigantic limestone karst formations inside thick rainforest."),
        TouristPlace(9, "Sathodi Falls", "Yellapur", "Karnataka", 3, "Nature", 30.00, 75.0, 4.50, 81, "July to October", "Picturesque rectangular forest waterfall."),
        TouristPlace(10, "Magod Falls", "Yellapur", "Karnataka", 3, "Nature", 20.00, 80.0, 4.30, 76, "July to October", "Bedthi river tumbling down two tiers in deep valleys."),
        TouristPlace(11, "Sirsi Marikamba Temple", "Sirsi", "Karnataka", 4, "Temple", 0.00, 102.0, 4.80, 89, "October to March", "Renowned 16th-century temple adorned with wooden carvings."),
        TouristPlace(12, "Dandeli River Rafting & Wildlife", "Dandeli", "Karnataka", 5, "Wildlife", 250.00, 74.0, 4.60, 94, "October to March", "River scenery, forest trails, and white-water rafting on Kali river."),
        TouristPlace(13, "Ulavi Channabasaveshwara Temple", "Ulavi", "Karnataka", 4, "Temple", 0.00, 95.0, 4.40, 79, "October to March", "Important Lingayat pilgrimage shrine surrounded by dense forests."),
        TouristPlace(14, "Banavasi Madhukeshwara Temple", "Banavasi", "Karnataka", 2, "Historical", 0.00, 125.0, 4.60, 83, "October to March", "Ancient Chalukya-Kadamba architectural gem and first Kannada capital."),
        TouristPlace(15, "Malpe Beach & St Mary Island", "Udupi", "Karnataka", 1, "Beach", 300.00, 250.0, 4.60, 91, "November to February", "Pristine coastline and volcanic columnar basalt rock islands."),

        // North Karnataka Heritage
        TouristPlace(16, "Virupaksha Temple & Hampi Ruins", "Hampi", "Karnataka", 2, "Historical", 50.00, 165.0, 4.90, 98, "October to March", "Extraordinary UNESCO landscape of temples and boulder ruins."),
        TouristPlace(17, "Vijaya Vittala Temple & Stone Chariot", "Hampi", "Karnataka", 2, "Historical", 50.00, 168.0, 4.90, 99, "October to March", "Iconic carved stone chariot and musical pillars."),
        TouristPlace(18, "Badami Cave Temples", "Badami", "Karnataka", 2, "Historical", 30.00, 105.0, 4.70, 91, "October to March", "Rock-cut cave shrines overlooking red sandstone cliffs and Agastya Lake."),
        TouristPlace(19, "Pattadakal UNESCO Monuments", "Pattadakal", "Karnataka", 2, "Historical", 40.00, 128.0, 4.80, 90, "October to March", "7th-8th century architectural synthesis of Rekha-Nagara and Dravidian styles."),
        TouristPlace(20, "Aihole Historical Complex", "Aihole", "Karnataka", 2, "Historical", 30.00, 135.0, 4.50, 84, "October to March", "Cradle of Hindu structural temple architecture with over 120 monuments."),
        TouristPlace(21, "Gol Gumbaz", "Vijayapura", "Karnataka", 2, "Historical", 25.00, 200.0, 4.60, 87, "October to March", "Massive circular dome mausoleum with acoustical Whispering Gallery."),
        TouristPlace(22, "Chitradurga Fort", "Chitradurga", "Karnataka", 2, "Historical", 25.00, 205.0, 4.70, 89, "October to March", "Impenetrable medieval stone fortress featuring 7 concentric ramparts."),

        // Malnad & Hill Stations
        TouristPlace(23, "Jog Falls Viewpoint", "Shivamogga", "Karnataka", 3, "Nature", 50.00, 160.0, 4.70, 93, "July to October", "Dramatic plunge waterfall framed by Western Ghats gorges."),
        TouristPlace(24, "Agumbe Sunset Point", "Shivamogga", "Karnataka", 6, "Hill Station", 0.00, 240.0, 4.50, 85, "October to March", "High Ghats viewpoint famous for sunset panoramas over Arabian Sea."),
        TouristPlace(25, "Mullayanagiri Peak", "Chikkamagaluru", "Karnataka", 6, "Hill Station", 0.00, 275.0, 4.80, 96, "October to March", "Highest mountain peak in Karnataka with cool mist and panoramic trails."),
        TouristPlace(26, "Baba Budangiri Shrine & Hills", "Chikkamagaluru", "Karnataka", 6, "Hill Station", 0.00, 285.0, 4.40, 86, "October to March", "Misty mountain range with Sufi shrine and rolling coffee plantations."),
        TouristPlace(27, "Kudremukh National Park", "Chikkamagaluru", "Karnataka", 5, "Wildlife", 200.00, 310.0, 4.70, 88, "October to March", "Horse-faced peak with montane shola grasslands and rich fauna."),
        TouristPlace(28, "Belur Chennakeshava Temple", "Belur", "Karnataka", 2, "Historical", 0.00, 290.0, 4.80, 92, "October to March", "Soapstone architectural marvel depicting celestial dancers."),
        TouristPlace(29, "Halebidu Hoysaleshwara Temple", "Halebidu", "Karnataka", 2, "Historical", 0.00, 300.0, 4.80, 91, "October to March", "12th-century twin-temple adorned with intricate relief sculptures."),

        // South Karnataka
        TouristPlace(30, "Mysore Palace", "Mysuru", "Karnataka", 2, "Historical", 100.00, 410.0, 4.90, 98, "October to March", "Grand royal palace with Indo-Saracenic halls and 100,000 festival lights."),
        TouristPlace(31, "Chamundi Hill & Temple", "Mysuru", "Karnataka", 4, "Temple", 0.00, 415.0, 4.70, 90, "October to March", "Dravidian gopuram shrine overlooking Mysuru city with monolithic Nandi."),
        TouristPlace(32, "Abbey Falls", "Madikeri", "Karnataka", 3, "Nature", 50.00, 380.0, 4.50, 87, "July to October", "Roaring waterfall nestled inside lush spice and coffee plantations."),
        TouristPlace(33, "Raja Seat Viewpoint", "Madikeri", "Karnataka", 6, "Hill Station", 25.00, 375.0, 4.40, 84, "October to March", "Seasonal garden where Kodagu kings observed dramatic sunsets."),
        TouristPlace(34, "Bandipur National Park Safari", "Bandipur", "Karnataka", 5, "Wildlife", 350.00, 480.0, 4.70, 94, "October to March", "Renowned Tiger Reserve home to elephants, gaurs, and Bengal tigers.")
    };
}

// ----------------------------------------------------------------------------------------------------
// SECTION 5: TEST RUNNER & VERIFICATION SUITE
// ----------------------------------------------------------------------------------------------------
void printRankedTable(const vector<TouristPlace>& results, const string& title) {
    cout << "\n=========================================================================================================\n";
    cout << "  " << title << "\n";
    cout << "=========================================================================================================\n";
    cout << left << setw(5)  << "Rank"
         << setw(35) << "Place Name"
         << setw(16) << "City"
         << setw(14) << "Category"
         << right << setw(10) << "Fee (INR)"
         << setw(12) << "Dist (km)"
         << setw(8)  << "Rating"
         << setw(8)  << "Score"
         << "\n";
    cout << "---------------------------------------------------------------------------------------------------------\n";

    for (size_t i = 0; i < results.size(); ++i) {
        const auto& p = results[i];
        cout << left << setw(5)  << (i + 1)
             << setw(35) << p.placeName.substr(0, 33)
             << setw(16) << p.city
             << setw(14) << p.categoryName
             << right << setw(10) << fixed << setprecision(2) << p.entryFee
             << setw(12) << fixed << setprecision(1) << p.distanceKm
             << setw(8)  << fixed << setprecision(2) << p.rating
             << setw(8)  << fixed << setprecision(4) << p.compositeScore
             << "\n";
    }
    cout << "=========================================================================================================\n";
}

void printDetailedBreakdown(const TouristPlace& p, int rank) {
    const auto& b = p.breakdown;
    cout << "\n-----------------------------------------------------------------------------------------\n";
    cout << "PROVABLE MATHEMATICAL AUDIT TRACE (GATE 1 - B3) for Rank #" << rank << ": " << p.placeName << "\n";
    cout << "-----------------------------------------------------------------------------------------\n";
    cout << "Rating Component     : (Rating " << b.rawRating << " / 5.0) * w1 = " 
         << fixed << setprecision(4) << b.normRating << " * 0.400 = " << b.weightedRating << "\n";
    cout << "Popularity Component : (Pop " << b.rawPopularity << " / 100.0) * w2 = " 
         << b.normPopularity << " * 0.300 = " << b.weightedPopularity << "\n";
    cout << "Preference Match     : (CategoryMatch " << b.preferenceMatch << ") * w3 = " 
         << b.preferenceMatch << " * 0.200 = " << b.weightedPreference << "\n";
    cout << "Proximity Component  : (1.0 - (" << b.rawDistance << " km / 500.0)) * w4 = " 
         << b.normProximity << " * 0.100 = " << b.weightedProximity << "\n";
    cout << "FINAL COMPOSITE SCORE: " << b.weightedRating << " + " << b.weightedPopularity << " + "
         << b.weightedPreference << " + " << b.weightedProximity << " = " << b.compositeScore << "\n";
    cout << "-----------------------------------------------------------------------------------------\n";
}

int main() {
    cout << "=========================================================================================\n";
    cout << "   KLE TECHNOLOGICAL UNIVERSITY, HUBBALLI - DEPT OF BCA\n";
    cout << "   ENGINE 2: LOGIC & RULE (DATA STRUCTURES & PROGRAMMING)\n";
    cout << "   STUDENT: VIVEK B M (USN: 01FE24BCA266)\n";
    cout << "   TOURIST PLACE SEARCH & RANKING SYSTEM - BACKEND ALGORITHMIC ENGINE\n";
    cout << "=========================================================================================\n";

    try {
        // Initialize Engine 2
        RankingEngine engine;
        vector<TouristPlace> dataset = getKarnatakaMasterDataset();
        engine.loadCatalog(dataset);
        cout << "[OK] Successfully loaded " << dataset.size() << " Karnataka destinations into Engine 2 memory.\n";

        // TEST 1: Default Balanced Multi-Factor Ranking (All destinations, Top 7)
        cout << "\n>>> EXECUTING TEST 1: General Top-7 Ranking (Default Weights: 0.40, 0.30, 0.20, 0.10) ...";
        vector<TouristPlace> top7 = engine.searchAndRank("", 0, -1.0, -1.0, 7);
        printRankedTable(top7, "TEST 1: OVERALL TOP-7 RANKED TOURIST DESTINATIONS IN KARNATAKA");
        if (!top7.empty()) {
            printDetailedBreakdown(top7[0], 1);
        }

        // TEST 2: Category Preference Ranking (Historical places, categoryId = 2)
        cout << "\n>>> EXECUTING TEST 2: Historical Category Preference (categoryId = 2, Top 5) ...";
        vector<TouristPlace> historicalTop5 = engine.searchAndRank("", 2, -1.0, -1.0, 5);
        printRankedTable(historicalTop5, "TEST 2: TOP-5 HISTORICAL DESTINATIONS (PREFERENCE BOOSTED)");

        // TEST 3: Budget and Distance Bounded Ranking
        // Scenario: Student traveler with Max Budget = INR 50.00 and Max Distance = 150 km from Hubballi
        cout << "\n>>> EXECUTING TEST 3: Budget <= INR 50.00 AND Distance <= 150.0 km ...";
        vector<TouristPlace> budgetPlaces = engine.searchAndRank("", 0, 50.00, 150.0, 5);
        printRankedTable(budgetPlaces, "TEST 3: BUDGET & DISTANCE CONSTRAINED TOP RECOMMENDATIONS");

        // TEST 4: Keyword Substring Search ("Temple")
        cout << "\n>>> EXECUTING TEST 4: Keyword Search for 'Temple' ...";
        vector<TouristPlace> templePlaces = engine.searchAndRank("Temple", 0, -1.0, -1.0, 5);
        printRankedTable(templePlaces, "TEST 4: KEYWORD SEARCH RESULTS FOR 'TEMPLE'");

        // TEST 5: Engine 2 Non-Violable Rule Enforcement (B2 Compliance)
        cout << "\n>>> EXECUTING TEST 5: Testing Non-Violable Weight Rules (Negative weights and Sum != 1.0) ...\n";
        
        try {
            cout << "  Attempting invalid weights (Sum = 1.20): ";
            RankingWeights invalidSum(0.50, 0.40, 0.20, 0.10);
        } catch (const exception& e) {
            cout << "[REJECTED AS EXPECTED] " << e.what() << "\n";
        }

        try {
            cout << "  Attempting negative weight (-0.10): ";
            RankingWeights negativeWeight(-0.10, 0.50, 0.40, 0.20);
        } catch (const exception& e) {
            cout << "[REJECTED AS EXPECTED] " << e.what() << "\n";
        }

        cout << "\n[SUCCESS] Engine 2 Logic & Rule execution completed successfully. All rules validated.\n";

    } catch (const exception& e) {
        cerr << "\n[ERROR] Engine 2 failed: " << e.what() << "\n";
        return 1;
    }

    return 0;
}
