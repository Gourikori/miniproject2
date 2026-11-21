/**
 * ====================================================================================================
 * Engine 2: Database Connection & Query Module (backend_db_connection.js)
 * Integrates Engine 2 (Logic & Rule) with Engine 1 (Data & Integrity - tourist_db1)
 * Uses mysql2/promise with connection pooling and parameterized queries.
 * ====================================================================================================
 */

require('dotenv').config();

let mysql;
try {
    mysql = require('mysql2/promise');
} catch (e) {
    mysql = null;
}

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tourist_db1',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 3000
};

let pool = null;

function getPool() {
    if (!mysql) {
        throw new Error("mysql2/promise dependency is not installed. Please run 'npm install'.");
    }
    if (!pool) {
        pool = mysql.createPool(dbConfig);
    }
    return pool;
}

/**
 * Verifies live database connectivity.
 */
async function testConnection() {
    if (!mysql) {
        return { connected: false, error: "mysql2/promise is not installed" };
    }
    try {
        const p = getPool();
        const connection = await p.getConnection();
        await connection.query('SELECT 1 AS health_check');
        connection.release();
        return { connected: true, host: dbConfig.host, port: dbConfig.port, database: dbConfig.database };
    } catch (err) {
        return { connected: false, host: dbConfig.host, port: dbConfig.port, database: dbConfig.database, error: err.message };
    }
}

/**
 * Loads categories from Engine 1 master lookup table.
 */
async function loadCategories() {
    const p = getPool();
    const [rows] = await p.query('SELECT category_id, category_name FROM categories1 ORDER BY category_id ASC');
    return rows;
}

/**
 * Loads active places from Engine 1 view vw_tourist_catalog.
 * Falls back to joining tourist_places with categories1 if view is missing.
 */
async function loadPlaces(activeOnly = true) {
    const p = getPool();
    try {
        // Attempt to query Engine 1's view
        const query = activeOnly 
            ? 'SELECT place_id, place_name, city, state, category_name, entry_fee, distance_km, rating, popularity, best_time_to_visit, status FROM vw_tourist_catalog'
            : 'SELECT p.place_id, p.place_name, p.city, p.state, c.category_name, p.entry_fee, p.distance_km, p.rating, p.popularity, p.best_time_to_visit, p.status FROM tourist_places p JOIN categories1 c ON p.category_id = c.category_id';
        const [rows] = await p.query(query);
        
        // Ensure category_id is populated
        return rows.map(r => ({
            ...r,
            entry_fee: parseFloat(r.entry_fee),
            distance_km: parseFloat(r.distance_km),
            rating: parseFloat(r.rating),
            popularity: parseInt(r.popularity, 10)
        }));
    } catch (viewErr) {
        // Fallback to direct table join with parameterized status filter
        const fallbackSql = activeOnly
            ? 'SELECT p.place_id, p.place_name, p.city, p.state, p.category_id, c.category_name, p.entry_fee, p.distance_km, p.rating, p.popularity, p.best_time_to_visit, p.description, p.status FROM tourist_places p JOIN categories1 c ON p.category_id = c.category_id WHERE p.status = ?'
            : 'SELECT p.place_id, p.place_name, p.city, p.state, p.category_id, c.category_name, p.entry_fee, p.distance_km, p.rating, p.popularity, p.best_time_to_visit, p.description, p.status FROM tourist_places p JOIN categories1 c ON p.category_id = c.category_id';
        const params = activeOnly ? ['ACTIVE'] : [];
        const [rows] = await p.query(fallbackSql, params);
        return rows.map(r => ({
            ...r,
            entry_fee: parseFloat(r.entry_fee),
            distance_km: parseFloat(r.distance_km),
            rating: parseFloat(r.rating),
            popularity: parseInt(r.popularity, 10)
        }));
    }
}

/**
 * Checks if ranking_config table exists in MySQL and loads active weights.
 * If ranking_config does not exist in Engine 1 database_queries.sql, returns exists: false.
 */
async function loadRankingConfig() {
    const p = getPool();
    try {
        const [tables] = await p.query("SHOW TABLES LIKE 'ranking_config'");
        if (tables.length === 0) {
            return {
                exists: false,
                reason: "Table 'ranking_config' does not exist in MySQL database (not defined in Engine 1 database_queries.sql)",
                weights: null
            };
        }
        const [rows] = await p.query("SELECT * FROM ranking_config LIMIT 1");
        if (rows.length === 0) {
            return { exists: true, weights: null, reason: "Table ranking_config exists but contains zero rows" };
        }
        return { exists: true, weights: rows[0], reason: "Loaded from MySQL ranking_config" };
    } catch (err) {
        return { exists: false, reason: err.message, weights: null };
    }
}

/**
 * Updates destination entry fee with parameterized query.
 * Requires administrative authentication before calling.
 */
async function updateEntryFee(placeId, newFee) {
    const p = getPool();
    const [result] = await p.query(
        'UPDATE tourist_places SET entry_fee = ? WHERE place_id = ?',
        [newFee, placeId]
    );
    return result;
}

/**
 * Updates destination rating and increments popularity with parameterized query.
 * Requires administrative authentication before calling.
 */
async function updateRating(placeId, newRating) {
    const p = getPool();
    const [result] = await p.query(
        'UPDATE tourist_places SET rating = ?, popularity = popularity + 1 WHERE place_id = ?',
        [newRating, placeId]
    );
    return result;
}

/**
 * Reads the Engine 1 audit log register.
 */
async function loadAuditLogs(limit = 50) {
    const p = getPool();
    const [rows] = await p.query(
        'SELECT audit_id, place_id, action_type, old_entry_fee, new_entry_fee, old_rating, new_rating, old_status, new_status, performed_by, performed_at FROM tourist_places_audit_log ORDER BY performed_at DESC LIMIT ?',
        [limit]
    );
    return rows;
}

module.exports = {
    getPool,
    testConnection,
    loadCategories,
    loadPlaces,
    loadRankingConfig,
    updateEntryFee,
    updateRating,
    loadAuditLogs,
    dbConfig
};
