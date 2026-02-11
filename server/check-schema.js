require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./db');

async function checkOrdersSchema() {
    try {
        const result = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            ORDER BY ordinal_position
        `);

        console.log('\n📋 ORDERS TABLE SCHEMA:\n');
        result.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });

        // Check for Shiprocket columns
        const hasShiprocketOrderId = result.rows.some(col => col.column_name === 'shiprocket_order_id');
        const hasShipmentId = result.rows.some(col => col.column_name === 'shipment_id');
        const hasAwbCode = result.rows.some(col => col.column_name === 'awb_code');

        console.log('\n🔍 SHIPROCKET COLUMNS CHECK:\n');
        console.log(`  shiprocket_order_id: ${hasShiprocketOrderId ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`  shipment_id: ${hasShipmentId ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`  awb_code: ${hasAwbCode ? '✅ EXISTS' : '❌ MISSING'}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkOrdersSchema();
