require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

// ANSI Color Codes for Terminal Output
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

// Initialize Report Object
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

// Database Pool
let pool;

async function runAudit() {
    console.log(`${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║     KOTTRAVAI DATABASE CONNECTION & RELIABILITY AUDIT     ║
║                  Supabase PostgreSQL                      ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

    // ========================================
    // 1. DATABASE CONNECTION CHECK
    // ========================================
    log.section('1. DATABASE CONNECTION CHECK');

    try {
        const startTime = Date.now();

        // Check if DATABASE_URL exists
        if (!process.env.DATABASE_URL) {
            log.error('DATABASE_URL not found in environment');
            report.connection.status = 'FAILED';
            report.connection.error = 'DATABASE_URL missing';
            report.productionReady = false;
            throw new Error('DATABASE_URL is not set');
        }

        // Parse connection string to check SSL
        const isLocal = process.env.DATABASE_URL.includes('localhost') ||
            process.env.DATABASE_URL.includes('127.0.0.1');
        const useSSL = !isLocal;

        // Create Pool
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: useSSL ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: 10000,
            max: 10,
            idleTimeoutMillis: 30000
        });

        // Test Connection
        const result = await pool.query('SELECT NOW(), version(), current_database()');
        const responseTime = Date.now() - startTime;

        // Get active connections
        const connResult = await pool.query(`
            SELECT count(*) as active_connections 
            FROM pg_stat_activity 
            WHERE datname = current_database()
        `);

        report.connection = {
            status: 'CONNECTED',
            responseTime: responseTime,
            ssl: useSSL,
            database: result.rows[0].current_database,
            version: result.rows[0].version.split(',')[0],
            activeConnections: connResult.rows[0].active_connections
        };

        log.success('Database Connected');
        log.info(`Response Time: ${responseTime}ms`);
        log.info(`SSL Enabled: ${useSSL}`);
        log.info(`Database: ${result.rows[0].current_database}`);
        log.info(`Version: ${result.rows[0].version.split(',')[0]}`);
        log.info(`Active Connections: ${connResult.rows[0].active_connections}`);

    } catch (err) {
        log.error('Database Connection Failed');
        log.error(err.message);
        report.connection.status = 'FAILED';
        report.connection.error = err.message;
        report.errors.push({
            section: 'Connection',
            error: err.message,
            timestamp: new Date().toISOString()
        });

        // Cannot continue without connection
        await generateReport();
        process.exit(1);
    }

    // ========================================
    // 2. ENVIRONMENT VARIABLE VALIDATION
    // ========================================
    log.section('2. ENVIRONMENT VARIABLE VALIDATION');

    const requiredEnvVars = [
        'DATABASE_URL',
        'PORT',
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
        'EMAIL_HOST',
        'EMAIL_USER',
        'EMAIL_PASS'
    ];

    const presentVars = [];
    const missingVars = [];

    requiredEnvVars.forEach(varName => {
        if (process.env[varName]) {
            presentVars.push(varName);
            log.success(`${varName}: Present`);
        } else {
            missingVars.push(varName);
            log.error(`${varName}: Missing`);
        }
    });

    report.environment = {
        status: missingVars.length === 0 ? 'PASS' : 'FAIL',
        present: presentVars,
        missing: missingVars,
        totalChecked: requiredEnvVars.length
    };

    if (missingVars.length > 0) {
        log.warning(`Missing ${missingVars.length} environment variable(s)`);
        report.errors.push({
            section: 'Environment',
            error: `Missing variables: ${missingVars.join(', ')}`,
            timestamp: new Date().toISOString()
        });
    } else {
        log.success('All environment variables loaded successfully');
    }

    // ========================================
    // 3. TABLES VERIFICATION
    // ========================================
    log.section('3. TABLES VERIFICATION');

    const requiredTables = ['products', 'orders', 'reviews', 'wishlist'];

    for (const tableName of requiredTables) {
        try {
            // Check table exists
            const tableCheck = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = $1
                )
            `, [tableName]);

            if (!tableCheck.rows[0].exists) {
                log.error(`Table '${tableName}' does not exist`);
                report.tables[tableName] = { exists: false };
                continue;
            }

            // Get row count
            const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
            const rowCount = parseInt(countResult.rows[0].count);

            // Get table structure
            const structureResult = await pool.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);

            report.tables[tableName] = {
                exists: true,
                rowCount: rowCount,
                columns: structureResult.rows.length,
                structure: structureResult.rows
            };

            log.success(`Table '${tableName}': ${rowCount} rows, ${structureResult.rows.length} columns`);

        } catch (err) {
            log.error(`Error checking table '${tableName}': ${err.message}`);
            report.tables[tableName] = { exists: false, error: err.message };
            report.errors.push({
                section: 'Tables',
                table: tableName,
                error: err.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // ========================================
    // 4. LIVE ORDER SAVE TEST
    // ========================================
    log.section('4. LIVE ORDER SAVE TEST (Write Test)');

    try {
        const testOrder = {
            customerName: 'DB Audit Test User',
            customerEmail: 'audit-test@kottravai.in',
            customerPhone: '9999999999',
            address: 'Test Address for DB Audit',
            city: 'Test City',
            pincode: '000000',
            total: 999.99,
            items: JSON.stringify([
                {
                    id: 'test-product-1',
                    name: 'Test Product',
                    price: 999.99,
                    quantity: 1
                }
            ]),
            paymentId: `test_payment_${Date.now()}`,
            orderId: `test_order_${Date.now()}`
        };

        const insertStart = Date.now();
        const insertResult = await pool.query(`
            INSERT INTO orders (
                customer_name, customer_email, customer_phone, 
                address, city, pincode, total, items, 
                payment_id, order_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, created_at
        `, [
            testOrder.customerName,
            testOrder.customerEmail,
            testOrder.customerPhone,
            testOrder.address,
            testOrder.city,
            testOrder.pincode,
            testOrder.total,
            testOrder.items,
            testOrder.paymentId,
            testOrder.orderId
        ]);
        const insertTime = Date.now() - insertStart;

        const insertedId = insertResult.rows[0].id;
        const insertedTimestamp = insertResult.rows[0].created_at;

        log.success('Test order inserted successfully');
        log.info(`Order ID: ${insertedId}`);
        log.info(`Insert Time: ${insertTime}ms`);
        log.info(`Timestamp: ${insertedTimestamp}`);

        // Fetch the same order back
        const fetchStart = Date.now();
        const fetchResult = await pool.query('SELECT * FROM orders WHERE id = $1', [insertedId]);
        const fetchTime = Date.now() - fetchStart;

        if (fetchResult.rows.length === 0) {
            throw new Error('Failed to fetch inserted test order');
        }

        log.success('Test order fetched successfully');
        log.info(`Fetch Time: ${fetchTime}ms`);

        // Verify data integrity
        const fetchedOrder = fetchResult.rows[0];
        const dataIntegrity =
            fetchedOrder.customer_name === testOrder.customerName &&
            fetchedOrder.customer_email === testOrder.customerEmail &&
            fetchedOrder.payment_id === testOrder.paymentId;

        if (dataIntegrity) {
            log.success('Data integrity verified');
        } else {
            log.error('Data integrity check failed');
        }

        // Clean up test order
        await pool.query('DELETE FROM orders WHERE id = $1', [insertedId]);
        log.info('Test order cleaned up');

        report.writeTest = {
            status: 'SUCCESS',
            insertTime: insertTime,
            fetchTime: fetchTime,
            dataIntegrity: dataIntegrity,
            orderId: insertedId
        };

    } catch (err) {
        log.error('Write test failed');
        log.error(err.message);
        report.writeTest = {
            status: 'FAILED',
            error: err.message
        };
        report.errors.push({
            section: 'WriteTest',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }

    // ========================================
    // 5. READ/WRITE SPEED TEST
    // ========================================
    log.section('5. READ/WRITE SPEED TEST (Performance)');

    try {
        // Simple Query Test
        const simpleStart = Date.now();
        await pool.query('SELECT 1');
        const simpleTime = Date.now() - simpleStart;

        // Complex Query Test (with JOIN)
        const complexStart = Date.now();
        await pool.query(`
            SELECT p.*, COUNT(r.id) as review_count
            FROM products p
            LEFT JOIN reviews r ON p.id = r.product_id
            GROUP BY p.id
            LIMIT 10
        `);
        const complexTime = Date.now() - complexStart;

        // Aggregate Query Test
        const aggStart = Date.now();
        await pool.query(`
            SELECT 
                COUNT(*) as total_products,
                AVG(price) as avg_price,
                MAX(price) as max_price,
                MIN(price) as min_price
            FROM products
        `);
        const aggTime = Date.now() - aggStart;

        const avgLatency = (simpleTime + complexTime + aggTime) / 3;

        report.performance = {
            simpleQuery: simpleTime,
            complexQuery: complexTime,
            aggregateQuery: aggTime,
            averageLatency: avgLatency,
            rating: avgLatency < 100 ? 'EXCELLENT' : avgLatency < 300 ? 'GOOD' : avgLatency < 500 ? 'FAIR' : 'POOR'
        };

        log.success(`Simple Query: ${simpleTime}ms`);
        log.success(`Complex Query (JOIN): ${complexTime}ms`);
        log.success(`Aggregate Query: ${aggTime}ms`);
        log.success(`Average Latency: ${avgLatency.toFixed(2)}ms`);
        log.success(`Performance Rating: ${report.performance.rating}`);

    } catch (err) {
        log.error('Performance test failed');
        log.error(err.message);
        report.performance = {
            status: 'FAILED',
            error: err.message
        };
        report.errors.push({
            section: 'Performance',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }

    // ========================================
    // 6. PRODUCTION CONNECTIVITY CHECK
    // ========================================
    log.section('6. PRODUCTION CONNECTIVITY CHECK');

    try {
        // Verify we can access the same database from different queries
        const db1 = await pool.query('SELECT current_database()');
        const db2 = await pool.query('SELECT current_database()');

        if (db1.rows[0].current_database === db2.rows[0].current_database) {
            log.success('Consistent database connection verified');
        }

        // Check if we're connected to production Supabase
        const isSupabase = process.env.DATABASE_URL.includes('supabase.com');
        const isPooler = process.env.DATABASE_URL.includes('pooler.supabase.com');

        log.info(`Connected to Supabase: ${isSupabase}`);
        log.info(`Using Connection Pooler: ${isPooler}`);

        if (isSupabase && isPooler) {
            log.success('Production Supabase connection confirmed');
        } else if (isSupabase) {
            log.warning('Connected to Supabase but not using pooler (may have connection limits)');
        } else {
            log.warning('Not connected to Supabase production database');
        }

    } catch (err) {
        log.error('Production connectivity check failed');
        log.error(err.message);
        report.errors.push({
            section: 'ProductionConnectivity',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }

    // ========================================
    // 7. ERROR LOG SCAN
    // ========================================
    log.section('7. ERROR LOG SCAN');

    const errorPatterns = [
        'ETIMEDOUT',
        'password authentication failed',
        'ECONNREFUSED',
        'SSL',
        'ENOTFOUND',
        'connection terminated',
        'too many clients'
    ];

    const errorLogPath = './error.log';
    let foundErrors = [];

    try {
        if (fs.existsSync(errorLogPath)) {
            const logContent = fs.readFileSync(errorLogPath, 'utf-8');

            errorPatterns.forEach(pattern => {
                const regex = new RegExp(pattern, 'gi');
                const matches = logContent.match(regex);
                if (matches && matches.length > 0) {
                    foundErrors.push({
                        pattern: pattern,
                        occurrences: matches.length
                    });
                    log.warning(`Found '${pattern}': ${matches.length} occurrence(s)`);
                }
            });

            if (foundErrors.length === 0) {
                log.success('No critical errors found in error.log');
            } else {
                log.error(`Found ${foundErrors.length} error pattern(s) in logs`);
                report.errors.push({
                    section: 'ErrorLogScan',
                    foundPatterns: foundErrors,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            log.info('No error.log file found (this is good!)');
        }
    } catch (err) {
        log.warning(`Could not scan error log: ${err.message}`);
    }

    // ========================================
    // 8. READ TEST (Sample Data)
    // ========================================
    log.section('8. READ TEST (Sample Data)');

    const readTables = ['products', 'orders', 'reviews'];

    for (const tableName of readTables) {
        try {
            const readStart = Date.now();
            const result = await pool.query(`SELECT * FROM ${tableName} LIMIT 5`);
            const readTime = Date.now() - readStart;

            report.readTest[tableName] = {
                status: 'SUCCESS',
                rowsReturned: result.rows.length,
                queryTime: readTime
            };

            log.success(`Read from '${tableName}': ${result.rows.length} rows in ${readTime}ms`);

        } catch (err) {
            log.error(`Read test failed for '${tableName}': ${err.message}`);
            report.readTest[tableName] = {
                status: 'FAILED',
                error: err.message
            };
            report.errors.push({
                section: 'ReadTest',
                table: tableName,
                error: err.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // ========================================
    // FINAL PRODUCTION READINESS ASSESSMENT
    // ========================================
    log.section('PRODUCTION READINESS ASSESSMENT');

    const checks = {
        connectionOk: report.connection.status === 'CONNECTED',
        envVarsOk: report.environment.status === 'PASS',
        tablesExist: Object.values(report.tables).every(t => t.exists),
        writeTestOk: report.writeTest.status === 'SUCCESS',
        performanceOk: report.performance.rating === 'EXCELLENT' || report.performance.rating === 'GOOD',
        noErrors: report.errors.length === 0
    };

    report.productionReady = Object.values(checks).every(check => check === true);

    console.log('\nProduction Readiness Checklist:');
    console.log(`  Database Connection:     ${checks.connectionOk ? '✅' : '❌'}`);
    console.log(`  Environment Variables:   ${checks.envVarsOk ? '✅' : '❌'}`);
    console.log(`  All Tables Exist:        ${checks.tablesExist ? '✅' : '❌'}`);
    console.log(`  Write Test Passed:       ${checks.writeTestOk ? '✅' : '❌'}`);
    console.log(`  Performance Acceptable:  ${checks.performanceOk ? '✅' : '❌'}`);
    console.log(`  No Critical Errors:      ${checks.noErrors ? '✅' : '❌'}`);

    if (report.productionReady) {
        log.success('✨ SYSTEM IS PRODUCTION READY ✨');
    } else {
        log.error('⚠️  SYSTEM IS NOT PRODUCTION READY');
        log.warning('Please review the errors and fix issues before deploying');
    }

    // Close pool
    await pool.end();

    // Generate Report
    await generateReport();
}

async function generateReport() {
    log.section('GENERATING REPORT');

    const reportPath = './database-status-report.json';
    const readableReportPath = './database-status-report.txt';

    // Save JSON Report
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log.success(`JSON Report saved: ${reportPath}`);

    // Generate Human-Readable Report
    const readableReport = `
╔═══════════════════════════════════════════════════════════╗
║          DATABASE STATUS REPORT - KOTTRAVAI               ║
╚═══════════════════════════════════════════════════════════╝

Generated: ${report.timestamp}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONNECTION STATUS:
  Status:              ${report.connection.status || 'N/A'}
  Response Time:       ${report.connection.responseTime || 'N/A'}ms
  SSL Enabled:         ${report.connection.ssl !== undefined ? report.connection.ssl : 'N/A'}
  Database:            ${report.connection.database || 'N/A'}
  Version:             ${report.connection.version || 'N/A'}
  Active Connections:  ${report.connection.activeConnections || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENVIRONMENT STATUS:
  Status:              ${report.environment.status || 'N/A'}
  Variables Present:   ${report.environment.present ? report.environment.present.length : 0}/${report.environment.totalChecked || 0}
  Missing Variables:   ${report.environment.missing ? report.environment.missing.join(', ') || 'None' : 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TABLES FOUND:
${Object.entries(report.tables).map(([name, data]) =>
        `  ${name.padEnd(15)} ${data.exists ? '✓' : '✗'}  ${data.rowCount !== undefined ? data.rowCount + ' rows' : ''}`
    ).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

READ TEST:
${Object.entries(report.readTest).map(([table, data]) =>
        `  ${table.padEnd(15)} ${data.status}  (${data.rowsReturned || 0} rows, ${data.queryTime || 0}ms)`
    ).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WRITE TEST:
  Status:              ${report.writeTest.status || 'N/A'}
  Insert Time:         ${report.writeTest.insertTime || 'N/A'}ms
  Fetch Time:          ${report.writeTest.fetchTime || 'N/A'}ms
  Data Integrity:      ${report.writeTest.dataIntegrity !== undefined ? (report.writeTest.dataIntegrity ? 'PASS' : 'FAIL') : 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LATENCY & PERFORMANCE:
  Simple Query:        ${report.performance.simpleQuery || 'N/A'}ms
  Complex Query:       ${report.performance.complexQuery || 'N/A'}ms
  Aggregate Query:     ${report.performance.aggregateQuery || 'N/A'}ms
  Average Latency:     ${report.performance.averageLatency ? report.performance.averageLatency.toFixed(2) : 'N/A'}ms
  Performance Rating:  ${report.performance.rating || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ERRORS FOUND:
${report.errors.length > 0 ? report.errors.map((err, i) =>
        `  ${i + 1}. [${err.section}] ${err.error}`
    ).join('\n') : '  None'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRODUCTION READY:     ${report.productionReady ? '✅ YES' : '❌ NO'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    fs.writeFileSync(readableReportPath, readableReport);
    log.success(`Readable Report saved: ${readableReportPath}`);

    console.log(readableReport);
}

// Run the audit
runAudit().catch(err => {
    console.error('Fatal error during audit:', err);
    process.exit(1);
});
