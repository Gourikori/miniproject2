-- =======================================================================================
-- KLE TECHNOLOGICAL UNIVERSITY, HUBBALLI
-- DEPARTMENT OF BACHELOR OF COMPUTER APPLICATIONS
-- THEME 4: REPORTING AND MIS SYSTEM / RULES CHECK RECORDS REGISTER
-- GATE 1: REQUIREMENTS BASELINE & DATABASE INTEGRITY FOUNDATION (10 MARKS)
-- Project: Tourist Place Search and Ranking System
-- Engine 1: Data & Integrity (Database Management Systems)
-- Student: Shrilakshmi G.S (USN: 01FE24BCA314)
-- Faculty Guides: Prof. Pavankumar Vadavi, Prof. Sayeeda Anjum
-- Repository: https://github.com/shri030306/Mini-project-.git
-- =======================================================================================

-- ---------------------------------------------------------------------------------------
-- SECTION 1: DATABASE INITIALIZATION
-- ---------------------------------------------------------------------------------------
DROP DATABASE IF EXISTS tourist_db1;
CREATE DATABASE tourist_db1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tourist_db1;

-- ---------------------------------------------------------------------------------------
-- SECTION 2: MASTER LOOKUP RELATIONS
-- B2 Compliance: Duplicate prevention via UNIQUE(category_name)
-- ---------------------------------------------------------------------------------------
CREATE TABLE categories1 (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------------------
-- SECTION 3: CORE RECORDS REGISTER (TOURIST PLACES)
-- Addresses Gate 1 - B2: Rules that must NEVER be violated:
--   Rule 1 (No Negative Values): entry_fee >= 0, distance_km >= 0, rating 0..5, popularity >= 0
--   Rule 2 (No Duplicate Postings): UNIQUE(place_name, city)
--   Rule 3 (No Orphan Records): FOREIGN KEY REFERENCES categories1 ON DELETE RESTRICT
-- ---------------------------------------------------------------------------------------
CREATE TABLE tourist_places (
    place_id INT AUTO_INCREMENT PRIMARY KEY,
    place_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL DEFAULT 'Karnataka',
    category_id INT NOT NULL,
    description TEXT,
    entry_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    distance_km DOUBLE NOT NULL DEFAULT 0.0,
    rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    popularity INT NOT NULL DEFAULT 0,
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    best_time_to_visit VARCHAR(50) DEFAULT 'October to March',
    
    -- B3 Compliance: Audit tracking timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- B2: Referential Integrity (Rejects orphan records)
    CONSTRAINT fk_places_category 
        FOREIGN KEY (category_id) REFERENCES categories1(category_id)
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    -- B2: Domain Integrity (Rejects invalid / out-of-bounds data)
    CONSTRAINT uq_place_city UNIQUE (place_name, city),
    CONSTRAINT chk_place_name_not_empty CHECK (CHAR_LENGTH(TRIM(place_name)) > 0),
    CONSTRAINT chk_city_not_empty CHECK (CHAR_LENGTH(TRIM(city)) > 0),
    CONSTRAINT chk_entry_fee CHECK (entry_fee >= 0.00),
    CONSTRAINT chk_distance CHECK (distance_km >= 0.0),
    CONSTRAINT chk_rating CHECK (rating >= 0.00 AND rating <= 5.00),
    CONSTRAINT chk_popularity CHECK (popularity >= 0),
    CONSTRAINT chk_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------------------
-- SECTION 4: AUDIT TRAIL REGISTER (GATE 1 - B3 COMPLIANCE)
-- Criterion: What every posting must record (who, when, what changed, old vs new value)
-- ---------------------------------------------------------------------------------------
CREATE TABLE tourist_places_audit_log (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    place_id INT NOT NULL,
    action_type VARCHAR(20) NOT NULL,
    old_entry_fee DECIMAL(10, 2) DEFAULT NULL,
    new_entry_fee DECIMAL(10, 2) DEFAULT NULL,
    old_rating DECIMAL(3, 2) DEFAULT NULL,
    new_rating DECIMAL(3, 2) DEFAULT NULL,
    old_status VARCHAR(10) DEFAULT NULL,
    new_status VARCHAR(10) DEFAULT NULL,
    performed_by VARCHAR(50) NOT NULL DEFAULT 'SYSTEM_ADMIN',
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------------------
-- SECTION 5: AUTOMATED AUDIT TRAIL TRIGGERS (GATE 1 - B3)
-- Guarantees audit logging even if administrative forms are bypassed
-- ---------------------------------------------------------------------------------------
DELIMITER $$

CREATE TRIGGER trg_audit_insert
AFTER INSERT ON tourist_places
FOR EACH ROW
BEGIN
    INSERT INTO tourist_places_audit_log 
    (place_id, action_type, new_entry_fee, new_rating, new_status, performed_by)
    VALUES 
    (NEW.place_id, 'INSERT_RECORD', NEW.entry_fee, NEW.rating, NEW.status, CURRENT_USER());
END$$

CREATE TRIGGER trg_audit_update
AFTER UPDATE ON tourist_places
FOR EACH ROW
BEGIN
    DECLARE action_str VARCHAR(50) DEFAULT 'GENERAL_UPDATE';
    
    IF OLD.entry_fee <> NEW.entry_fee THEN
        SET action_str = 'UPDATE_ENTRY_FEE';
    ELSEIF OLD.status <> NEW.status THEN
        SET action_str = 'STATUS_CHANGE';
    ELSEIF OLD.rating <> NEW.rating THEN
        SET action_str = 'UPDATE_RATING';
    END IF;

    INSERT INTO tourist_places_audit_log 
    (place_id, action_type, old_entry_fee, new_entry_fee, old_rating, new_rating, old_status, new_status, performed_by)
    VALUES 
    (NEW.place_id, action_str, OLD.entry_fee, NEW.entry_fee, OLD.rating, NEW.rating, OLD.status, NEW.status, CURRENT_USER());
END$$

DELIMITER ;

-- ---------------------------------------------------------------------------------------
-- SECTION 6: MASTER CATEGORY SEEDING
-- ---------------------------------------------------------------------------------------
INSERT INTO categories1 (category_id, category_name) VALUES
(1, 'Beach'),
(2, 'Historical'),
(3, 'Nature'),
(4, 'Temple'),
(5, 'Wildlife'),
(6, 'Hill Station');

-- ---------------------------------------------------------------------------------------
-- SECTION 7: MASTER DESTINATION SEEDING (34 KARNATAKA PLACES)
-- Aligned with Vivek's Engine 2 app.js catalog
-- ---------------------------------------------------------------------------------------
INSERT INTO tourist_places 
(place_name, city, state, category_id, entry_fee, distance_km, rating, popularity, description, best_time_to_visit)
VALUES
-- Local Hubballi - Dharwad
('Unkal Lake & Park', 'Hubballi', 'Karnataka', 3, 10.00, 6.0, 4.30, 82, 'A calm lakeside escape for an evening walk, a quiet pause or a family outing in Hubballi.', 'July to October (Monsoon)'),
('Chandramouleshwara Temple', 'Hubballi', 'Karnataka', 4, 0.00, 8.5, 4.50, 78, 'Discover the stone carvings and Chalukyan architecture of this historic temple.', 'October to March'),
('Nrupatunga Betta Viewpoint', 'Hubballi', 'Karnataka', 3, 20.00, 10.0, 4.40, 80, 'Scenic hillock offering panoramic viewpoints across Hubballi-Dharwad.', 'July to October (Monsoon)'),
('Sadhankeri Park & Lake', 'Dharwad', 'Karnataka', 3, 10.00, 22.0, 4.20, 72, 'Serene garden memorial commemorating national poet Da. Ra. Bendre.', 'October to March'),

-- Coastal & Western Ghats
('Gokarna Om Beach', 'Gokarna', 'Karnataka', 1, 0.00, 150.0, 4.60, 92, 'A sweeping coastline, rocky coves and a laid-back beach town atmosphere.', 'November to February (Winter)'),
('Kudle Beach', 'Gokarna', 'Karnataka', 1, 0.00, 152.0, 4.50, 88, 'Scenic coastal stretch ideal for swimming, sunsets, and relaxed beachside cafes.', 'November to February (Winter)'),
('Murudeshwar Temple & Beach', 'Murudeshwar', 'Karnataka', 4, 0.00, 185.0, 4.70, 95, 'A dramatic coastal landmark combining temple architecture with Arabian Sea views.', 'October to March'),
('Yana Rocks & Caves', 'Kumta', 'Karnataka', 3, 20.00, 140.0, 4.60, 85, 'Gigantic crystalline limestone rock formations surrounded by thick rainforest.', 'October to March'),
('Sathodi Falls', 'Yellapur', 'Karnataka', 3, 30.00, 75.0, 4.50, 81, 'A picturesque rectangular forest waterfall formed by multiple tributaries.', 'July to October (Monsoon)'),
('Magod Falls', 'Yellapur', 'Karnataka', 3, 20.00, 80.0, 4.30, 76, 'Bedthi river tumbling down two tiers amidst dense Western Ghats valleys.', 'July to October (Monsoon)'),
('Sirsi Marikamba Temple', 'Sirsi', 'Karnataka', 4, 0.00, 102.0, 4.80, 89, 'Renowned 16th-century historic temple adorned with traditional wooden carvings.', 'October to March'),
('Dandeli River Rafting & Wildlife', 'Dandeli', 'Karnataka', 5, 250.00, 74.0, 4.60, 94, 'River scenery, forest trails and outdoor adventures along the Kali River.', 'October to March'),
('Ulavi Channabasaveshwara Temple', 'Ulavi', 'Karnataka', 4, 0.00, 95.0, 4.40, 79, 'Important pilgrimage shrine and samadhi surrounded by deep evergreen forests.', 'October to March'),
('Banavasi Madhukeshwara Temple', 'Banavasi', 'Karnataka', 2, 0.00, 125.0, 4.60, 83, 'Ancient Chalukya-Kadamba architectural gem and capital of the first Kannada kingdom.', 'October to March'),
('Malpe Beach & St Mary Island', 'Udupi', 'Karnataka', 1, 300.00, 250.0, 4.60, 91, 'Pristine coastline and volcanic columnar basalt rock islands in the Arabian Sea.', 'November to February (Winter)'),

-- North Karnataka Heritage
('Virupaksha Temple & Hampi Ruins', 'Hampi', 'Karnataka', 2, 50.00, 165.0, 4.90, 98, 'Walk through an extraordinary landscape of temples, stone streets and Vijayanagara ruins.', 'October to March'),
('Vijaya Vittala Temple & Stone Chariot', 'Hampi', 'Karnataka', 2, 50.00, 168.0, 4.90, 99, 'See the carved stone chariot and musical pillars at one of Hampi best-known monuments.', 'October to March'),
('Badami Cave Temples', 'Badami', 'Karnataka', 2, 30.00, 105.0, 4.70, 91, 'Explore rock-cut cave shrines overlooking red sandstone cliffs and Agastya Lake.', 'October to March'),
('Pattadakal UNESCO Monuments', 'Pattadakal', 'Karnataka', 2, 40.00, 128.0, 4.80, 90, 'UNESCO World Heritage cluster of 8th-century Rekha-Nagara and Dravidian temples.', 'October to March'),
('Aihole Historical Complex', 'Aihole', 'Karnataka', 2, 30.00, 135.0, 4.50, 84, 'Known as the cradle of Hindu rock and structural temple architecture.', 'October to March'),
('Gol Gumbaz', 'Vijayapura', 'Karnataka', 2, 25.00, 200.0, 4.60, 87, 'Massive domed mausoleum famous for its acoustical Whispering Gallery.', 'October to March'),
('Chitradurga Fort', 'Chitradurga', 'Karnataka', 2, 25.00, 205.0, 4.70, 89, 'Impenetrable medieval stone fortress featuring seven circular walls and 19 gateways.', 'October to March'),

-- Malnad & Hill Stations
('Jog Falls Viewpoint', 'Shivamogga', 'Karnataka', 3, 50.00, 160.0, 4.70, 93, 'Take in a dramatic waterfall framed by the forested Western Ghats.', 'July to October (Monsoon)'),
('Agumbe Sunset Point', 'Shivamogga', 'Karnataka', 6, 0.00, 240.0, 4.50, 85, 'High Ghats viewpoint famous for panoramic sunset views over the Arabian Sea.', 'October to March'),
('Mullayanagiri Peak', 'Chikkamagaluru', 'Karnataka', 6, 0.00, 275.0, 4.80, 96, 'A high mountain viewpoint with winding roads, cool air and wide hill-country views.', 'October to March'),
('Baba Budangiri Shrine & Hills', 'Chikkamagaluru', 'Karnataka', 6, 0.00, 285.0, 4.40, 86, 'Misty mountain range reverenced for its Sufi shrine and rolling coffee estates.', 'October to March'),
('Kudremukh National Park', 'Chikkamagaluru', 'Karnataka', 5, 200.00, 310.0, 4.70, 88, 'Horse-faced peak and biodiversity hotspot with shola grasslands and wild fauna.', 'October to March'),
('Belur Chennakeshava Temple', 'Belur', 'Karnataka', 2, 0.00, 290.0, 4.80, 92, 'Masterpiece of Hoysala architecture carved with intricate soapstone sculptures.', 'October to March'),
('Halebidu Hoysaleshwara Temple', 'Halebidu', 'Karnataka', 2, 0.00, 300.0, 4.80, 91, '12th-century twin-temple adorned with thousands of relief carvings and friezes.', 'October to March'),

-- South Karnataka
('Mysore Palace', 'Mysuru', 'Karnataka', 2, 100.00, 410.0, 4.90, 98, 'Visit an ornate royal residence known for its grand halls and illuminated facade.', 'October to March'),
('Chamundi Hill & Temple', 'Mysuru', 'Karnataka', 4, 0.00, 415.0, 4.70, 90, 'Prominent hilltop landmark overlooking Mysuru city with a towering Dravidian gopuram.', 'October to March'),
('Abbey Falls', 'Madikeri', 'Karnataka', 3, 50.00, 380.0, 4.50, 87, 'Scenic gushing waterfall nestled inside private spice and coffee plantations.', 'July to October (Monsoon)'),
('Raja Seat Viewpoint', 'Madikeri', 'Karnataka', 6, 25.00, 375.0, 4.40, 84, 'Seasonal garden and cliff-edge pavilion used by Kodagu kings to watch sunsets.', 'October to March'),
('Bandipur National Park Safari', 'Bandipur', 'Karnataka', 5, 350.00, 480.0, 4.70, 94, 'Renowned Project Tiger reserve with herds of Asian elephants and leopards.', 'October to March');

-- ---------------------------------------------------------------------------------------
-- SECTION 8: TRANSACTION OPERATIONS (GATE 1 - B1 COMPLIANCE)
-- Demonstrates every transaction type and its effect on records
-- ---------------------------------------------------------------------------------------
UPDATE tourist_places 
SET entry_fee = 35.00 
WHERE place_name = 'Sathodi Falls';

UPDATE tourist_places 
SET rating = 4.85, popularity = popularity + 1 
WHERE place_name = 'Virupaksha Temple & Hampi Ruins';

UPDATE tourist_places 
SET status = 'INACTIVE' 
WHERE place_name = 'Sadhankeri Park & Lake';

UPDATE tourist_places 
SET status = 'ACTIVE' 
WHERE place_name = 'Sadhankeri Park & Lake';

-- ---------------------------------------------------------------------------------------
-- SECTION 9: REPORTING & MIS VIEWS (THEME 4 EVIDENCE)
-- ---------------------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_tourist_catalog AS
SELECT 
    p.place_id, p.place_name, p.city, p.state, c.category_name,
    p.entry_fee, p.distance_km, p.rating, p.popularity,
    p.best_time_to_visit, p.status
FROM tourist_places p
JOIN categories1 c ON p.category_id = c.category_id
WHERE p.status = 'ACTIVE';

CREATE OR REPLACE VIEW vw_ranked_tourist_places AS
SELECT 
    p.place_id, p.place_name, p.city, c.category_name,
    p.rating, p.popularity, p.distance_km, p.entry_fee,
    ROUND((0.50 * (p.rating / 5.0)) + (0.35 * (p.popularity / 100.0)) - (0.15 * (LEAST(p.distance_km, 500.0) / 500.0)), 4) AS ranking_score
FROM tourist_places p
JOIN categories1 c ON p.category_id = c.category_id
WHERE p.status = 'ACTIVE'
ORDER BY ranking_score DESC;

CREATE OR REPLACE VIEW vw_category_summary AS
SELECT 
    c.category_name,
    COUNT(p.place_id) AS total_places,
    ROUND(AVG(p.rating), 2) AS avg_rating,
    ROUND(AVG(p.entry_fee), 2) AS avg_entry_fee,
    MIN(p.distance_km) AS nearest_km,
    MAX(p.distance_km) AS farthest_km
FROM categories1 c
LEFT JOIN tourist_places p ON c.category_id = p.category_id AND p.status = 'ACTIVE'
GROUP BY c.category_id, c.category_name;

-- ---------------------------------------------------------------------------------------
-- SECTION 10: VERIFICATION & VIVA QUERIES
-- ---------------------------------------------------------------------------------------
SELECT * FROM vw_tourist_catalog;
SELECT * FROM tourist_places_audit_log ORDER BY performed_at DESC;
SELECT * FROM vw_category_summary;

