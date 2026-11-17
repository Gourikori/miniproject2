
-- STEP 1: INITIALIZE DATABASE
-- =======================================================================================
DROP DATABASE IF EXISTS tourist_db1;
CREATE DATABASE tourist_db1;
USE tourist_db1;

-- =======================================================================================
-- STEP 2: CREATE MASTER CATEGORIES TABLE (LOOKUP)
-- Ensures duplicate categories cannot be created (UNIQUE constraint)
-- =======================================================================================
CREATE TABLE categories1 (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
);

-- =======================================================================================
-- STEP 3: CREATE TOURIST PLACES TABLE (CORE RECORDS REGISTER)
-- Enforces Non-Violable Rules at the database level:
-- 1. Foreign Key rejects orphan records
-- 2. Unique constraint prevents duplicate destinations within the same city
-- 3. CHECK constraints prevent negative fees, negative distances, and out-of-bounds ratings
-- =======================================================================================
CREATE TABLE tourist_places (
    place_id INT AUTO_INCREMENT PRIMARY KEY,
    place_name VARCHAR(120) NOT NULL,
    city VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    entry_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    distance_km DOUBLE NOT NULL DEFAULT 0.0,
    rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    popularity INT NOT NULL DEFAULT 0,
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Referential Integrity (Foreign Key)
    FOREIGN KEY (category_id) REFERENCES categories1(category_id),

    -- Domain & Business Rules Integrity
    CONSTRAINT uq_place_city UNIQUE (place_name, city),
    CHECK (entry_fee >= 0),
    CHECK (distance_km >= 0),
    CHECK (rating BETWEEN 0 AND 5),
    CHECK (popularity >= 0),
    CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- =======================================================================================
-- STEP 4: SEED MASTER CATEGORIES
-- =======================================================================================
INSERT INTO categories1 (category_name) VALUES
('Beach'),
('Historical'),
('Nature'),
('Temple'),
('Wildlife'),
('Hill Station');

-- =======================================================================================
-- STEP 5: SEED INITIAL PROTOTYPE DESTINATIONS (12 KEY KARNATAKA SPOTS)
-- =======================================================================================
INSERT INTO tourist_places 
(place_name, city, category_id, entry_fee, distance_km, rating, popularity)
VALUES
('Unkal Lake & Park', 'Hubballi', 3, 10.00, 6.0, 4.30, 82),
('Chandramouleshwara Temple', 'Hubballi', 4, 0.00, 8.5, 4.50, 78),
('Nrupatunga Betta Viewpoint', 'Hubballi', 3, 20.00, 10.0, 4.40, 80),
('Sadhankeri Park & Lake', 'Dharwad', 3, 10.00, 22.0, 4.20, 72),
('Gokarna Om Beach', 'Gokarna', 1, 0.00, 150.0, 4.60, 92),
('Murudeshwar Temple & Beach', 'Murudeshwar', 4, 0.00, 185.0, 4.70, 95),
('Jog Falls Viewpoint', 'Shivamogga', 3, 50.00, 160.0, 4.70, 93),
('Virupaksha Temple & Hampi', 'Hampi', 2, 50.00, 165.0, 4.90, 98),
('Badami Cave Temples', 'Badami', 2, 30.00, 105.0, 4.70, 91),
('Mysore Palace', 'Mysuru', 2, 100.00, 410.0, 4.90, 98),
('Dandeli River Rafting', 'Dandeli', 5, 250.00, 74.0, 4.60, 94),
('Mullayanagiri Peak', 'Chikkamagaluru', 6, 0.00, 275.0, 4.80, 96);

-- =======================================================================================
-- STEP 6: VIEW INITIAL DATA REGISTER
-- =======================================================================================
SELECT * FROM tourist_places;

-- =======================================================================================
-- STEP 7: SCHEMA EVOLUTION (ALTER TABLE OPERATIONS)
-- Demonstrating database evolution for MIS reporting:
-- 1. Adding audit update timestamp
-- 2. Adding seasonal recommendation attribute
-- 3. Expanding character length for descriptive place names
-- =======================================================================================
ALTER TABLE tourist_places 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE tourist_places 
ADD COLUMN best_time_to_visit VARCHAR(50) DEFAULT 'October to March';

ALTER TABLE tourist_places 
MODIFY COLUMN place_name VARCHAR(150) NOT NULL;

-- Verify Schema Changes
DESCRIBE tourist_places;

-- =======================================================================================
-- STEP 8: DATA UPDATES (SEASONAL RULES)
-- Updating seasonal travel advice based on destination category
-- =======================================================================================
UPDATE tourist_places 
SET best_time_to_visit = 'July to October (Monsoon)' 
WHERE category_id = 3; -- Nature spots best in monsoon

UPDATE tourist_places 
SET best_time_to_visit = 'November to February (Winter)' 
WHERE category_id = 1; -- Beaches best in winter

-- =======================================================================================
-- STEP 9: GATE 0 - THEME 4 EVIDENCE (CRITERION B1)
-- "What currently cannot be proved is named: an item nobody can trace"
-- Demonstrating the problem that justifies our Theme 4 MIS System:
-- =======================================================================================

-- Transaction: Updating Jog Falls entry fee from 50.00 to 75.00
UPDATE tourist_places 
SET entry_fee = 75.00 
WHERE place_name = 'Jog Falls Viewpoint';

-- Current state: Jog Falls now shows 75.00
SELECT place_id, place_name, city, entry_fee, updated_at 
FROM tourist_places 
WHERE place_name = 'Jog Falls Viewpoint';

-- THEME 4 PROBLEM PROOF:
-- In this basic Gate 0 table, we can see updated_at changed, BUT:
-- 1. There is NO record that the old fee was 50.00!
-- 2. There is NO record of WHO changed the fee!
-- 3. If a tourist disputes the fee at the gate, administrators CANNOT PROVE the prior fee!
-- This unprovable discrepancy is the exact reason Gate 1 introduces the automated Audit Trail Register!

-- =======================================================================================
-- STEP 10: GATE 0 FINAL VERIFICATION QUERY
-- =======================================================================================
SELECT 
    p.place_id,
    p.place_name,
    p.city,
    c.category_name,
    p.entry_fee,
    p.distance_km,
    p.rating,
    p.popularity,
    p.best_time_to_visit,
    p.status,
    p.created_at,
    p.updated_at
FROM tourist_places p
JOIN categories1 c ON p.category_id = c.category_id
ORDER BY p.rating DESC;

