const http = require('http');

console.log('\n🔍 DIAGNOSING FRONTEND PRODUCT DISPLAY ISSUE\n');

// Test 1: Check if backend API is returning products
console.log('━━━ Test 1: Backend API Response ━━━\n');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const products = JSON.parse(data);
            console.log(`✅ Backend API Status: ${res.statusCode}`);
            console.log(`✅ Products returned: ${products.length}`);
            console.log(`\nFirst product sample:`);
            if (products.length > 0) {
                console.log(JSON.stringify(products[0], null, 2).substring(0, 500) + '...');
            }

            console.log('\n━━━ Test 2: Environment Check ━━━\n');
            console.log('Expected frontend config:');
            console.log('  VITE_API_URL=http://localhost:5000/api');
            console.log('\nFrontend should be calling:');
            console.log('  http://localhost:5000/api/products');
            console.log('\nVite proxy config (vite.config.ts):');
            console.log('  /api -> http://localhost:5000');
            console.log('\n━━━ Possible Issues ━━━\n');
            console.log('1. Frontend dev server not restarted after .env change');
            console.log('2. Browser cache showing old data');
            console.log('3. CORS blocking the request');
            console.log('4. Frontend running on wrong port');
            console.log('\n━━━ Solutions ━━━\n');
            console.log('1. Restart frontend dev server: npm run dev');
            console.log('2. Clear browser cache and hard reload (Ctrl+Shift+R)');
            console.log('3. Check browser console for errors (F12)');
            console.log('4. Verify frontend is on port 5174 (as per vite.config.ts)');

        } catch (err) {
            console.error('❌ Failed to parse response:', err.message);
        }
    });
});

req.on('error', (err) => {
    console.error('❌ Backend API Error:', err.message);
    console.log('\n⚠️  Backend server may not be running on port 5000');
});

req.end();
