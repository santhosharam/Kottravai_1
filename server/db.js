require('dotenv').config();
const { Pool } = require('pg');

let pool;

if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL environment variable is missing!");
    // Create a mock pool that fails gracefully on query
    pool = {
        query: async () => {
            const errorMsg = "❌ Database not configured: DATABASE_URL is missing in environment variables.";
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
    };
} else {
    try {
        const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
    } catch (err) {
        console.error("❌ ERROR: Failed to create Postgres Pool:", err);
        pool = {
            query: async () => {
                console.error("❌ Cannot execute query: Pool creation failed.");
                throw new Error("Database connection failed");
            }
        };
    }
}

// Pre-warm the connection
if (pool.query) {
    pool.query('SELECT NOW()')
        .then(() => console.log('🚀 DB Connection Pre-warmed'))
        .catch(err => console.error('⚠️ DB Warmup failed:', err.message));
}

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
