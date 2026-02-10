require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkTestOrders() {
    try {
        const result = await pool.query("SELECT * FROM orders WHERE order_id LIKE 'TEST_%'");
        console.log(`\nTest orders found: ${result.rows.length}`);

        if (result.rows.length > 0) {
            console.log('\nTest Orders:');
            result.rows.forEach(order => {
                console.log(`- ${order.order_id} | ${order.customer_name} | ${order.created_at}`);
            });

            // Clean up test orders
            const deleteResult = await pool.query("DELETE FROM orders WHERE order_id LIKE 'TEST_%'");
            console.log(`\n✅ Cleaned up ${deleteResult.rowCount} test orders`);
        } else {
            console.log('✅ No test orders to clean up');
        }

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkTestOrders();
