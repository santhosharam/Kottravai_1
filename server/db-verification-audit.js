/**
 * DATABASE CONNECTION & DATA FLOW VERIFICATION AUDIT
 * Kottravai E-commerce System
 * 
 * This script performs a complete verification of:
 * - Database connection status
 * - Environment variable validation
 * - Table existence and data integrity
 * - Read/Write operations
 * - Performance metrics
 * - Error log scanning
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

// ANSI Color codes for better readability
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = {
    header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(70)}${colors.reset}`),
    section: (msg) => console.log(`\n${colors.bright}${colors.blue}📋 ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
    data: (label, value) => console.log(`   ${colors.magenta}${label}:${colors.reset} ${value}`)
};

// Report data structure
const report = {
    timestamp: new Date().toISOString(),
    connection: {},
    environment: {},
    tables: {},
    readTest: {},
    writeTest: {},
    performance: {},
    errors: [],
    productionReady: false
};

// Main verification function
async function runDatabaseAudit() {
    log.header();
    console.log(`${colors.bright}${colors.magenta}DATABASE STATUS REPORT - KOTTRAVAI E-COMMERCE${colors.reset}`);
    console.log(`${colors.cyan}Generated: ${new Date().toLocaleString()}${colors.reset}`);
    log.header();

    try {
        // 1. Environment Variable Validation
        await validateEnvironment();

        // 2. Database Connection Check
        const pool = await testDatabaseConnection();

        // 3. Tables Verification
        await verifyTables(pool);

        // 4. Read Test
        await testReadOperations(pool);

        // 5. Write Test (Live Order Save Test)
        await testWriteOperations(pool);

        // 6. Performance Test
        await testPerformance(pool);

        // 7. Error Log Scan
        await scanErrorLogs();

        // 8. Generate Final Report
        generateFinalReport();

        // Close pool
        await pool.end();

    } catch (error) {
        log.error(`Critical Error: ${error.message}`);
        report.errors.push({
            type: 'CRITICAL',
            message: error.message,
            stack: error.stack
        });
        generateFinalReport();
        process.exit(1);
    }
}

// 1. ENVIRONMENT VARIABLE VALIDATION
async function validateEnvironment() {
    log.section('1. ENVIRONMENT VARIABLE VALIDATION');

    const requiredVars = [
        'DATABASE_URL',
        'PORT',
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
        'EMAIL_HOST',
        'EMAIL_USER',
        'EMAIL_PASS'
    ];

    const optionalVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY'
    ];

    let allPresent = true;
    const missing = [];
    const present = [];

    // Check required variables
    for (const varName of requiredVars) {
        if (process.env[varName]) {
            present.push(varName);

            // Mask sensitive data for display
            let displayValue = process.env[varName];
            if (varName.includes('SECRET') || varName.includes('PASS') || varName.includes('KEY')) {
                displayValue = '***' + displayValue.slice(-4);
            } else if (varName === 'DATABASE_URL') {
                // Show only host info
                const match = displayValue.match(/@([^:]+)/);
                displayValue = match ? `***@${match[1]}` : '***';
            }

            log.success(`${varName}: ${displayValue}`);
        } else {
            missing.push(varName);
            log.error(`${varName}: MISSING`);
            allPresent = false;
        }
    }

    // Check optional variables
    log.info('Optional Variables:');
    for (const varName of optionalVars) {
        if (process.env[varName]) {
            log.data(varName, 'Present');
        } else {
            log.warning(`${varName}: Not set`);
        }
    }

    // Validate DATABASE_URL format
    if (process.env.DATABASE_URL) {
        const dbUrl = process.env.DATABASE_URL;
        const isValid = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
        const hasSSL = dbUrl.includes('supabase.com') || dbUrl.includes('pooler');

        if (isValid) {
            log.success('DATABASE_URL format is valid');
            log.data('SSL Required', hasSSL ? 'Yes' : 'No');
        } else {
            log.error('DATABASE_URL format is invalid');
            allPresent = false;
        }
    }

    report.environment = {
        status: allPresent ? 'PASS' : 'FAIL',
        present: present,
        missing: missing,
        totalChecked: requiredVars.length
    };

    if (!allPresent) {
        throw new Error('Required environment variables are missing');
    }
}

// 2. DATABASE CONNECTION CHECK
async function testDatabaseConnection() {
    log.section('2. DATABASE CONNECTION CHECK');

    const startTime = Date.now();

    try {
        const isLocal = process.env.DATABASE_URL.includes('localhost') ||
            process.env.DATABASE_URL.includes('127.0.0.1');

        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: isLocal ? false : { rejectUnauthorized: false },
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        });

        // Test connection
        const result = await pool.query('SELECT NOW(), version(), current_database()');
        const connectionTime = Date.now() - startTime;

        log.success('Database Connected');
        log.data('Response Time', `${connectionTime}ms`);
        log.data('Server Time', result.rows[0].now);
        log.data('Database', result.rows[0].current_database);
        log.data('PostgreSQL Version', result.rows[0].version.split(',')[0]);
        log.data('SSL Enabled', !isLocal ? 'Yes' : 'No');

        // Test pool stability
        const poolInfo = await pool.query('SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()');
        log.data('Active Connections', poolInfo.rows[0].count);

        report.connection = {
            status: 'CONNECTED',
            responseTime: connectionTime,
            ssl: !isLocal,
            database: result.rows[0].current_database,
            version: result.rows[0].version.split(',')[0],
            activeConnections: poolInfo.rows[0].count
        };

        return pool;

    } catch (error) {
        const connectionTime = Date.now() - startTime;
        log.error('Database Connection Failed');
        log.error(`Error: ${error.message}`);
        log.data('Time to Fail', `${connectionTime}ms`);

        report.connection = {
            status: 'FAILED',
            error: error.message,
            responseTime: connectionTime
        };

        throw error;
    }
}

// 3. TABLES VERIFICATION
async function verifyTables(pool) {
    log.section('3. TABLES VERIFICATION');

    const expectedTables = ['products', 'orders', 'reviews', 'wishlist'];
    const tableResults = {};

    for (const tableName of expectedTables) {
        try {
            // Check if table exists
            const existsQuery = `
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                )
            `;
            const existsResult = await pool.query(existsQuery, [tableName]);

            if (existsResult.rows[0].exists) {
                // Get row count
                const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
                const count = parseInt(countResult.rows[0].count);

                // Get table structure
                const structureQuery = `
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = $1
                    ORDER BY ordinal_position
                `;
                const structure = await pool.query(structureQuery, [tableName]);

                log.success(`Table '${tableName}' exists`);
                log.data('Row Count', count);
                log.data('Columns', structure.rows.length);

                tableResults[tableName] = {
                    exists: true,
                    rowCount: count,
                    columns: structure.rows.length,
                    structure: structure.rows
                };
            } else {
                log.error(`Table '${tableName}' does NOT exist`);
                tableResults[tableName] = {
                    exists: false
                };
            }
        } catch (error) {
            log.error(`Error checking table '${tableName}': ${error.message}`);
            tableResults[tableName] = {
                exists: false,
                error: error.message
            };
        }
    }

    report.tables = tableResults;

    // Check if all required tables exist
    const allTablesExist = expectedTables.every(t => tableResults[t]?.exists);
    if (!allTablesExist) {
        log.warning('Some required tables are missing. Run /api/init-db to create them.');
    }
}

// 4. READ TEST
async function testReadOperations(pool) {
    log.section('4. READ OPERATIONS TEST');

    const tests = [
        {
            name: 'Fetch Products',
            query: 'SELECT * FROM products LIMIT 5',
            table: 'products'
        },
        {
            name: 'Fetch Orders',
            query: 'SELECT * FROM orders LIMIT 5',
            table: 'orders'
        },
        {
            name: 'Fetch Reviews',
            query: 'SELECT * FROM reviews LIMIT 5',
            table: 'reviews'
        }
    ];

    const readResults = {};

    for (const test of tests) {
        try {
            const startTime = Date.now();
            const result = await pool.query(test.query);
            const duration = Date.now() - startTime;

            log.success(`${test.name}: ${result.rows.length} rows`);
            log.data('Query Time', `${duration}ms`);

            readResults[test.table] = {
                status: 'SUCCESS',
                rowsReturned: result.rows.length,
                queryTime: duration
            };
        } catch (error) {
            log.error(`${test.name} failed: ${error.message}`);
            readResults[test.table] = {
                status: 'FAILED',
                error: error.message
            };
        }
    }

    report.readTest = readResults;
}

// 5. WRITE TEST (Live Order Save Test)
async function testWriteOperations(pool) {
    log.section('5. WRITE OPERATIONS TEST (Live Order Save)');

    const testOrderId = `TEST_${Date.now()}`;
    let insertedOrderId = null;

    try {
        // Insert test order
        const insertStart = Date.now();
        const insertQuery = `
            INSERT INTO orders (
                customer_name, customer_email, customer_phone, 
                address, city, pincode, total, items, 
                payment_id, order_id, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, created_at
        `;

        const testData = [
            'Test Customer',
            'test@kottravai.in',
            '9999999999',
            'Test Address',
            'Test City',
            '600001',
            999.99,
            JSON.stringify([{ id: 'test-1', name: 'Test Product', quantity: 1, price: 999.99 }]),
            'test_payment_id',
            testOrderId,
            'Test'
        ];

        const insertResult = await pool.query(insertQuery, testData);
        const insertDuration = Date.now() - insertStart;
        insertedOrderId = insertResult.rows[0].id;

        log.success('Test order inserted successfully');
        log.data('Order ID', insertedOrderId);
        log.data('Order Number', testOrderId);
        log.data('Insert Time', `${insertDuration}ms`);
        log.data('Timestamp', insertResult.rows[0].created_at);

        // Fetch the same order
        const fetchStart = Date.now();
        const fetchResult = await pool.query('SELECT * FROM orders WHERE id = $1', [insertedOrderId]);
        const fetchDuration = Date.now() - fetchStart;

        if (fetchResult.rows.length > 0) {
            log.success('Test order fetched successfully');
            log.data('Fetch Time', `${fetchDuration}ms`);
            log.data('Customer Name', fetchResult.rows[0].customer_name);
            log.data('Total Amount', fetchResult.rows[0].total);
            log.data('Items Saved', JSON.parse(fetchResult.rows[0].items).length);
        } else {
            log.error('Failed to fetch inserted order');
        }

        // Clean up test order
        await pool.query('DELETE FROM orders WHERE order_id = $1', [testOrderId]);
        log.info('Test order cleaned up');

        report.writeTest = {
            status: 'SUCCESS',
            insertTime: insertDuration,
            fetchTime: fetchDuration,
            orderId: insertedOrderId,
            dataIntegrity: fetchResult.rows.length > 0
        };

    } catch (error) {
        log.error(`Write test failed: ${error.message}`);

        // Attempt cleanup
        if (testOrderId) {
            try {
                await pool.query('DELETE FROM orders WHERE order_id = $1', [testOrderId]);
            } catch (cleanupError) {
                log.warning('Failed to cleanup test order');
            }
        }

        report.writeTest = {
            status: 'FAILED',
            error: error.message
        };
    }
}

// 6. PERFORMANCE TEST
async function testPerformance(pool) {
    log.section('6. READ/WRITE SPEED TEST');

    const performanceMetrics = {};

    try {
        // Test 1: Simple SELECT
        const simpleStart = Date.now();
        await pool.query('SELECT 1');
        performanceMetrics.simpleQuery = Date.now() - simpleStart;

        // Test 2: Complex JOIN query
        const joinStart = Date.now();
        await pool.query(`
            SELECT p.*, COUNT(r.id) as review_count
            FROM products p
            LEFT JOIN reviews r ON p.id = r.product_id
            GROUP BY p.id
            LIMIT 10
        `);
        performanceMetrics.complexQuery = Date.now() - joinStart;

        // Test 3: Aggregate query
        const aggStart = Date.now();
        await pool.query(`
            SELECT 
                COUNT(*) as total_products,
                COUNT(*) FILTER (WHERE is_best_seller = true) as best_sellers,
                AVG(price) as avg_price
            FROM products
        `);
        performanceMetrics.aggregateQuery = Date.now() - aggStart;

        log.success('Performance tests completed');
        log.data('Simple Query', `${performanceMetrics.simpleQuery}ms`);
        log.data('Complex JOIN Query', `${performanceMetrics.complexQuery}ms`);
        log.data('Aggregate Query', `${performanceMetrics.aggregateQuery}ms`);

        // Performance rating
        const avgLatency = (performanceMetrics.simpleQuery + performanceMetrics.complexQuery + performanceMetrics.aggregateQuery) / 3;
        let rating = 'EXCELLENT';
        if (avgLatency > 100) rating = 'GOOD';
        if (avgLatency > 500) rating = 'FAIR';
        if (avgLatency > 1000) rating = 'POOR';

        log.data('Average Latency', `${avgLatency.toFixed(2)}ms`);
        log.data('Performance Rating', rating);

        report.performance = {
            ...performanceMetrics,
            averageLatency: avgLatency,
            rating: rating
        };

    } catch (error) {
        log.error(`Performance test failed: ${error.message}`);
        report.performance = {
            status: 'FAILED',
            error: error.message
        };
    }
}

// 7. ERROR LOG SCAN
async function scanErrorLogs() {
    log.section('7. ERROR LOG SCAN');

    const errorPatterns = [
        { pattern: /ETIMEDOUT/gi, name: 'Connection Timeout' },
        { pattern: /password authentication failed/gi, name: 'Authentication Failed' },
        { pattern: /ECONNREFUSED/gi, name: 'Connection Refused' },
        { pattern: /SSL.*error/gi, name: 'SSL Error' },
        { pattern: /ENOTFOUND/gi, name: 'Host Not Found' },
        { pattern: /too many connections/gi, name: 'Connection Pool Exhausted' }
    ];

    const logFiles = ['error.log', 'server/error.log'];
    const foundErrors = [];

    for (const logFile of logFiles) {
        try {
            if (fs.existsSync(logFile)) {
                const content = fs.readFileSync(logFile, 'utf-8');

                for (const { pattern, name } of errorPatterns) {
                    const matches = content.match(pattern);
                    if (matches) {
                        foundErrors.push({
                            file: logFile,
                            type: name,
                            count: matches.length
                        });
                        log.warning(`Found ${matches.length} '${name}' errors in ${logFile}`);
                    }
                }
            }
        } catch (error) {
            log.info(`Could not read ${logFile}`);
        }
    }

    if (foundErrors.length === 0) {
        log.success('No critical errors found in logs');
    }

    report.errors = foundErrors;
}

// 8. GENERATE FINAL REPORT
function generateFinalReport() {
    log.header();
    log.section('FINAL DATABASE STATUS REPORT');
    log.header();

    console.log(`\n${colors.bright}Connection Status:${colors.reset}`);
    if (report.connection.status === 'CONNECTED') {
        log.success(`Connected (${report.connection.responseTime}ms)`);
        log.data('Database', report.connection.database);
        log.data('SSL', report.connection.ssl ? 'Enabled' : 'Disabled');
    } else {
        log.error('Connection Failed');
        if (report.connection.error) {
            log.error(report.connection.error);
        }
    }

    console.log(`\n${colors.bright}Environment Status:${colors.reset}`);
    if (report.environment.status === 'PASS') {
        log.success(`All ${report.environment.totalChecked} required variables present`);
    } else {
        log.error(`Missing variables: ${report.environment.missing.join(', ')}`);
    }

    console.log(`\n${colors.bright}Tables Found:${colors.reset}`);
    for (const [table, info] of Object.entries(report.tables)) {
        if (info.exists) {
            log.success(`${table}: ${info.rowCount} rows, ${info.columns} columns`);
        } else {
            log.error(`${table}: NOT FOUND`);
        }
    }

    console.log(`\n${colors.bright}Read Test:${colors.reset}`);
    for (const [table, result] of Object.entries(report.readTest)) {
        if (result.status === 'SUCCESS') {
            log.success(`${table}: ${result.rowsReturned} rows (${result.queryTime}ms)`);
        } else {
            log.error(`${table}: ${result.error}`);
        }
    }

    console.log(`\n${colors.bright}Write Test:${colors.reset}`);
    if (report.writeTest.status === 'SUCCESS') {
        log.success(`Order saved and retrieved successfully`);
        log.data('Insert Time', `${report.writeTest.insertTime}ms`);
        log.data('Fetch Time', `${report.writeTest.fetchTime}ms`);
    } else {
        log.error(`Write test failed: ${report.writeTest.error}`);
    }

    console.log(`\n${colors.bright}Performance:${colors.reset}`);
    if (report.performance.rating) {
        log.data('Average Latency', `${report.performance.averageLatency.toFixed(2)}ms`);
        log.data('Rating', report.performance.rating);
    } else {
        log.error('Performance test failed');
    }

    console.log(`\n${colors.bright}Errors Found:${colors.reset}`);
    if (report.errors.length === 0) {
        log.success('No critical errors in logs');
    } else {
        for (const error of report.errors) {
            log.warning(`${error.type}: ${error.count} occurrences in ${error.file}`);
        }
    }

    // Determine production readiness
    const isProductionReady =
        report.connection.status === 'CONNECTED' &&
        report.environment.status === 'PASS' &&
        Object.values(report.tables).every(t => t.exists) &&
        report.writeTest.status === 'SUCCESS' &&
        report.performance.rating !== 'POOR';

    console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(70)}${colors.reset}`);
    console.log(`${colors.bright}Production Ready:${colors.reset} ${isProductionReady ? colors.green + '✅ YES' : colors.red + '❌ NO'}${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}${'='.repeat(70)}${colors.reset}\n`);

    // Save report to file
    const reportPath = 'database-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log.info(`Full report saved to: ${reportPath}`);

    report.productionReady = isProductionReady;
}

// Run the audit
runDatabaseAudit().catch(error => {
    console.error('Audit failed:', error);
    process.exit(1);
});
