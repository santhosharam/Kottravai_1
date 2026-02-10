require('dotenv').config();
const { Pool } = require('pg');
const http = require('http');

// ANSI Color Codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
    section: (msg) => console.log(`\n${colors.bold}${colors.blue}━━━ ${msg} ━━━${colors.reset}\n`)
};

// Report object
const report = {
    timestamp: new Date().toISOString(),
    database: {},
    backend: {},
    frontend: {},
    dataFlow: {},
    issues: [],
    overallStatus: 'UNKNOWN'
};

// Database Pool
let pool;

// Helper function to make HTTP requests
function makeRequest(options) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

async function runConnectivityTest() {
    console.log(`${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║   FRONTEND ↔ BACKEND ↔ DATABASE CONNECTIVITY TEST        ║
║              Kottravai E-commerce System                  ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

    // ========================================
    // 1. DATABASE LAYER TEST
    // ========================================
    log.section('1. DATABASE LAYER - Direct Connection Test');

    try {
        const startTime = Date.now();
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
        });

        // Test connection
        const dbResult = await pool.query('SELECT NOW(), current_database()');
        const dbResponseTime = Date.now() - startTime;

        // Get product count
        const productCount = await pool.query('SELECT COUNT(*) FROM products');
        const orderCount = await pool.query('SELECT COUNT(*) FROM orders');

        report.database = {
            status: 'CONNECTED',
            responseTime: dbResponseTime,
            database: dbResult.rows[0].current_database,
            productsCount: parseInt(productCount.rows[0].count),
            ordersCount: parseInt(orderCount.rows[0].count)
        };

        log.success('Database connected successfully');
        log.info(`Response Time: ${dbResponseTime}ms`);
        log.info(`Database: ${dbResult.rows[0].current_database}`);
        log.info(`Products in DB: ${productCount.rows[0].count}`);
        log.info(`Orders in DB: ${orderCount.rows[0].count}`);

    } catch (err) {
        log.error('Database connection failed');
        log.error(err.message);
        report.database = { status: 'FAILED', error: err.message };
        report.issues.push({ layer: 'Database', error: err.message });
    }

    // ========================================
    // 2. BACKEND API LAYER TEST
    // ========================================
    log.section('2. BACKEND API LAYER - Server Endpoint Test');

    const backendPort = process.env.PORT || 5000;
    const backendHost = 'localhost';

    // Test 1: Health Check
    try {
        log.info('Testing /api/health endpoint...');
        const healthStart = Date.now();
        const healthResponse = await makeRequest({
            hostname: backendHost,
            port: backendPort,
            path: '/api/health',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const healthTime = Date.now() - healthStart;

        if (healthResponse.statusCode === 200) {
            log.success(`Health check passed (${healthTime}ms)`);
            const healthData = JSON.parse(healthResponse.body);
            log.info(`Server status: ${healthData.status}`);

            report.backend.health = {
                status: 'OK',
                responseTime: healthTime,
                data: healthData
            };
        } else {
            throw new Error(`Health check failed with status ${healthResponse.statusCode}`);
        }
    } catch (err) {
        log.error('Health check failed');
        log.error(err.message);
        report.backend.health = { status: 'FAILED', error: err.message };
        report.issues.push({ layer: 'Backend-Health', error: err.message });
    }

    // Test 2: Products API
    try {
        log.info('Testing /api/products endpoint...');
        const productsStart = Date.now();
        const productsResponse = await makeRequest({
            hostname: backendHost,
            port: backendPort,
            path: '/api/products',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const productsTime = Date.now() - productsStart;

        if (productsResponse.statusCode === 200) {
            const products = JSON.parse(productsResponse.body);
            log.success(`Products API working (${productsTime}ms)`);
            log.info(`Products fetched: ${products.length}`);

            report.backend.products = {
                status: 'OK',
                responseTime: productsTime,
                count: products.length
            };
        } else {
            throw new Error(`Products API failed with status ${productsResponse.statusCode}`);
        }
    } catch (err) {
        log.error('Products API failed');
        log.error(err.message);
        report.backend.products = { status: 'FAILED', error: err.message };
        report.issues.push({ layer: 'Backend-Products', error: err.message });
    }

    // Test 3: Orders API
    try {
        log.info('Testing /api/orders endpoint...');
        const ordersStart = Date.now();
        const ordersResponse = await makeRequest({
            hostname: backendHost,
            port: backendPort,
            path: '/api/orders',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const ordersTime = Date.now() - ordersStart;

        if (ordersResponse.statusCode === 200) {
            const orders = JSON.parse(ordersResponse.body);
            log.success(`Orders API working (${ordersTime}ms)`);
            log.info(`Orders fetched: ${orders.length}`);

            report.backend.orders = {
                status: 'OK',
                responseTime: ordersTime,
                count: orders.length
            };
        } else {
            throw new Error(`Orders API failed with status ${ordersResponse.statusCode}`);
        }
    } catch (err) {
        log.error('Orders API failed');
        log.error(err.message);
        report.backend.orders = { status: 'FAILED', error: err.message };
        report.issues.push({ layer: 'Backend-Orders', error: err.message });
    }

    // ========================================
    // 3. DATA FLOW VERIFICATION
    // ========================================
    log.section('3. DATA FLOW - Backend to Database Consistency');

    try {
        // Compare database counts with API counts
        const dbProductCount = report.database.productsCount;
        const apiProductCount = report.backend.products?.count;
        const dbOrderCount = report.database.ordersCount;
        const apiOrderCount = report.backend.orders?.count;

        log.info(`Database Products: ${dbProductCount}`);
        log.info(`API Products: ${apiProductCount}`);
        log.info(`Database Orders: ${dbOrderCount}`);
        log.info(`API Orders: ${apiOrderCount}`);

        const productsMatch = dbProductCount === apiProductCount;
        const ordersMatch = dbOrderCount === apiOrderCount;

        if (productsMatch && ordersMatch) {
            log.success('Data consistency verified - DB and API counts match');
            report.dataFlow.consistency = 'VERIFIED';
        } else {
            log.warning('Data mismatch detected between DB and API');
            if (!productsMatch) {
                log.warning(`Products mismatch: DB=${dbProductCount}, API=${apiProductCount}`);
            }
            if (!ordersMatch) {
                log.warning(`Orders mismatch: DB=${dbOrderCount}, API=${apiOrderCount}`);
            }
            report.dataFlow.consistency = 'MISMATCH';
            report.issues.push({
                layer: 'DataFlow',
                error: 'Count mismatch between database and API'
            });
        }

        report.dataFlow.productsMatch = productsMatch;
        report.dataFlow.ordersMatch = ordersMatch;

    } catch (err) {
        log.error('Data flow verification failed');
        log.error(err.message);
        report.dataFlow.consistency = 'FAILED';
        report.issues.push({ layer: 'DataFlow', error: err.message });
    }

    // ========================================
    // 4. FRONTEND DETECTION
    // ========================================
    log.section('4. FRONTEND LAYER - Detection & Status');

    // Check if frontend is running (typically on port 5173 for Vite)
    const frontendPorts = [5173, 3000, 8080];
    let frontendDetected = false;
    let frontendPort = null;

    for (const port of frontendPorts) {
        try {
            log.info(`Checking for frontend on port ${port}...`);
            const frontendResponse = await makeRequest({
                hostname: 'localhost',
                port: port,
                path: '/',
                method: 'GET',
                timeout: 3000
            });

            if (frontendResponse.statusCode === 200) {
                frontendDetected = true;
                frontendPort = port;
                log.success(`Frontend detected on port ${port}`);
                report.frontend = {
                    status: 'RUNNING',
                    port: port,
                    accessible: true
                };
                break;
            }
        } catch (err) {
            // Port not accessible, continue checking
        }
    }

    if (!frontendDetected) {
        log.warning('Frontend not detected on common ports (5173, 3000, 8080)');
        log.info('Frontend may be running on a different port or not started');
        report.frontend = {
            status: 'NOT_DETECTED',
            message: 'Frontend server not found on common ports'
        };
    }

    // ========================================
    // 5. CORS & CONNECTIVITY CHECK
    // ========================================
    log.section('5. CORS & CROSS-ORIGIN CONNECTIVITY');

    try {
        // Check if backend allows CORS
        const corsResponse = await makeRequest({
            hostname: backendHost,
            port: backendPort,
            path: '/api/health',
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:5173',
                'Access-Control-Request-Method': 'GET'
            }
        });

        const corsHeaders = corsResponse.headers['access-control-allow-origin'];
        if (corsHeaders) {
            log.success('CORS enabled on backend');
            log.info(`CORS Origin: ${corsHeaders}`);
            report.backend.cors = {
                enabled: true,
                allowedOrigin: corsHeaders
            };
        } else {
            log.warning('CORS headers not found - may cause frontend issues');
            report.backend.cors = {
                enabled: false,
                warning: 'CORS not properly configured'
            };
        }
    } catch (err) {
        log.warning('CORS check failed');
        report.backend.cors = { status: 'UNKNOWN', error: err.message };
    }

    // ========================================
    // 6. END-TO-END CONNECTIVITY SUMMARY
    // ========================================
    log.section('6. END-TO-END CONNECTIVITY SUMMARY');

    const checks = {
        databaseConnected: report.database.status === 'CONNECTED',
        backendHealthy: report.backend.health?.status === 'OK',
        productsAPIWorking: report.backend.products?.status === 'OK',
        ordersAPIWorking: report.backend.orders?.status === 'OK',
        dataConsistent: report.dataFlow.consistency === 'VERIFIED',
        frontendRunning: report.frontend.status === 'RUNNING'
    };

    console.log('\nConnectivity Checklist:');
    console.log(`  ✓ Database Layer:           ${checks.databaseConnected ? '✅ Connected' : '❌ Failed'}`);
    console.log(`  ✓ Backend Health:           ${checks.backendHealthy ? '✅ Healthy' : '❌ Failed'}`);
    console.log(`  ✓ Products API:             ${checks.productsAPIWorking ? '✅ Working' : '❌ Failed'}`);
    console.log(`  ✓ Orders API:               ${checks.ordersAPIWorking ? '✅ Working' : '❌ Failed'}`);
    console.log(`  ✓ Data Consistency:         ${checks.dataConsistent ? '✅ Verified' : '⚠️  Mismatch'}`);
    console.log(`  ✓ Frontend:                 ${checks.frontendRunning ? '✅ Running' : '⚠️  Not Detected'}`);

    // Determine overall status
    const criticalChecks = [
        checks.databaseConnected,
        checks.backendHealthy,
        checks.productsAPIWorking,
        checks.ordersAPIWorking
    ];

    if (criticalChecks.every(check => check === true)) {
        if (checks.dataConsistent && checks.frontendRunning) {
            report.overallStatus = 'EXCELLENT';
            log.success('✨ ALL SYSTEMS OPERATIONAL - Full Stack Connected ✨');
        } else if (checks.dataConsistent) {
            report.overallStatus = 'GOOD';
            log.success('✅ Backend & Database Fully Connected (Frontend not detected)');
        } else {
            report.overallStatus = 'FAIR';
            log.warning('⚠️  Backend & Database Connected but data inconsistency detected');
        }
    } else {
        report.overallStatus = 'CRITICAL';
        log.error('❌ CRITICAL ISSUES DETECTED - System not fully operational');
    }

    // Display issues
    if (report.issues.length > 0) {
        log.section('ISSUES DETECTED');
        report.issues.forEach((issue, i) => {
            log.error(`${i + 1}. [${issue.layer}] ${issue.error}`);
        });
    }

    // Close pool
    if (pool) {
        await pool.end();
    }

    // Save report
    const fs = require('fs');
    fs.writeFileSync('./connectivity-report.json', JSON.stringify(report, null, 2));
    log.success('Report saved: ./connectivity-report.json');

    // Generate summary
    console.log(`\n${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bold}CONNECTIVITY STATUS: ${getStatusColor(report.overallStatus)}${report.overallStatus}${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

function getStatusColor(status) {
    switch (status) {
        case 'EXCELLENT': return colors.green;
        case 'GOOD': return colors.green;
        case 'FAIR': return colors.yellow;
        case 'CRITICAL': return colors.red;
        default: return colors.reset;
    }
}

// Run the test
runConnectivityTest().catch(err => {
    console.error('Fatal error during connectivity test:', err);
    process.exit(1);
});
