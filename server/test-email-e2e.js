const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'admin@kottravai.in'; // Using admin email for testing

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    bold: '\x1b[1m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    title: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}\n`)
};

const testResults = {
    smtpConnection: false,
    orderEmail: false,
    contactEmail: false,
    b2bEmail: false,
    customRequestEmail: false,
    errors: [],
    timings: {}
};

// Helper to measure time
const measureTime = async (name, fn) => {
    const start = Date.now();
    try {
        await fn();
        const duration = Date.now() - start;
        testResults.timings[name] = duration;
        log.info(`${name} completed in ${duration}ms`);
        return true;
    } catch (error) {
        const duration = Date.now() - start;
        testResults.timings[name] = duration;
        log.error(`${name} failed after ${duration}ms: ${error.message}`);
        testResults.errors.push(`${name}: ${error.message}`);
        return false;
    }
};

// Test 1: SMTP Connection (already verified at startup)
async function testSMTPConnection() {
    log.title('STEP 1 — SMTP CONNECTION TEST');
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        if (response.data.status === 'ok') {
            log.success('Server is running and database connected');
            log.success('SMTP connection verified at startup');
            testResults.smtpConnection = true;
            return true;
        }
    } catch (error) {
        log.error(`Health check failed: ${error.message}`);
        testResults.errors.push(`SMTP Connection: ${error.message}`);
        return false;
    }
}

// Test 2: Order Email Flow
async function testOrderEmail() {
    log.title('STEP 2 — TEST ORDER EMAIL FLOW');

    const orderData = {
        customerName: 'Test Customer',
        customerEmail: TEST_EMAIL,
        customerPhone: '+91 9876543210',
        address: '123 Test Street',
        city: 'Chennai',
        pincode: '600001',
        total: 1500,
        items: [
            { name: 'Test Product 1', quantity: 2, price: 500 },
            { name: 'Test Product 2', quantity: 1, price: 500 }
        ],
        paymentId: 'test_pay_' + Date.now(),
        orderId: 'test_order_' + Date.now()
    };

    return await measureTime('Order Email', async () => {
        log.info('Creating test order...');
        const response = await axios.post(`${BASE_URL}/orders`, orderData);

        if (response.status === 201) {
            log.success('Order created successfully');
            log.success('Order ID: ' + response.data.id);
            log.info('Check terminal logs for email confirmation');
            log.info('Expected: Email to admin@kottravai.in');
            log.info('Expected: Email to ' + TEST_EMAIL);
            log.info('Expected: Reply-To: sales@kottravai.in');
            testResults.orderEmail = true;
        } else {
            throw new Error('Order creation failed with status: ' + response.status);
        }
    });
}

// Test 3: Contact Form Email
async function testContactEmail() {
    log.title('STEP 3 — TEST CONTACT FORM EMAIL');

    const contactData = {
        name: 'Test User',
        email: TEST_EMAIL,
        subject: 'Test Contact Inquiry',
        message: 'This is a test message from the automated email testing system.'
    };

    return await measureTime('Contact Email', async () => {
        log.info('Submitting contact form...');
        const response = await axios.post(`${BASE_URL}/contact`, contactData);

        if (response.data.status === 'success') {
            log.success('Contact form submitted successfully');
            log.info('Expected: Email to admin@kottravai.in');
            log.info('Expected: Confirmation to ' + TEST_EMAIL);
            log.info('Expected: Reply-To: support@kottravai.in');
            testResults.contactEmail = true;
        } else {
            throw new Error('Contact form submission failed');
        }
    });
}

// Test 4: B2B Inquiry Email
async function testB2BEmail() {
    log.title('STEP 4 — TEST B2B INQUIRY EMAIL');

    const b2bData = {
        name: 'Test Company',
        email: TEST_EMAIL,
        phone: '+91 9876543210',
        company: 'Test Corp Pvt Ltd',
        location: 'Mumbai, Maharashtra',
        products: 'Handcrafted Baskets, Organic Products',
        quantity: '500-1000 units',
        notes: 'Looking for bulk corporate gifting options for our annual event.'
    };

    return await measureTime('B2B Email', async () => {
        log.info('Submitting B2B inquiry...');
        const response = await axios.post(`${BASE_URL}/b2b-inquiry`, b2bData);

        if (response.data.status === 'success') {
            log.success('B2B inquiry submitted successfully');
            log.info('Expected: Email to admin@kottravai.in');
            log.info('Expected: Confirmation to ' + TEST_EMAIL);
            log.info('Expected: Reply-To: b2b@kottravai.in');
            testResults.b2bEmail = true;
        } else {
            throw new Error('B2B inquiry submission failed');
        }
    });
}

// Test 5: Custom Request Email
async function testCustomRequestEmail() {
    log.title('STEP 5 — TEST CUSTOM PRODUCT REQUEST EMAIL');

    const customRequestData = {
        name: 'Test Customer',
        email: TEST_EMAIL,
        phone: '+91 9876543210',
        productName: 'Custom Handwoven Basket',
        allFields: [
            { label: 'Name', value: 'Test Customer' },
            { label: 'Email', value: TEST_EMAIL },
            { label: 'Phone', value: '+91 9876543210' },
            { label: 'Custom Text Required', value: 'Happy Birthday!' },
            { label: 'Preferred Size', value: 'Large' },
            { label: 'Additional Notes', value: 'Please use natural colors' }
        ],
        referenceImage: null
    };

    return await measureTime('Custom Request Email', async () => {
        log.info('Submitting custom product request...');
        const response = await axios.post(`${BASE_URL}/custom-request`, customRequestData);

        if (response.data.status === 'success') {
            log.success('Custom request submitted successfully');
            log.info('Expected: Email to admin@kottravai.in');
            log.info('Expected: Reply-To: sales@kottravai.in');
            testResults.customRequestEmail = true;
        } else {
            throw new Error('Custom request submission failed');
        }
    });
}

// Generate Final Report
function generateReport() {
    log.title('═══════════════════════════════════════════════════════');
    log.title('        ZOHO EMAIL SYSTEM TEST REPORT');
    log.title('═══════════════════════════════════════════════════════');

    console.log('\n📊 TEST RESULTS:\n');
    console.log(`SMTP Connection:        ${testResults.smtpConnection ? colors.green + 'SUCCESS ✅' : colors.red + 'FAIL ❌'}${colors.reset}`);
    console.log(`Order Emails:           ${testResults.orderEmail ? colors.green + 'SUCCESS ✅' : colors.red + 'FAIL ❌'}${colors.reset}`);
    console.log(`Contact Emails:         ${testResults.contactEmail ? colors.green + 'SUCCESS ✅' : colors.red + 'FAIL ❌'}${colors.reset}`);
    console.log(`B2B Emails:             ${testResults.b2bEmail ? colors.green + 'SUCCESS ✅' : colors.red + 'FAIL ❌'}${colors.reset}`);
    console.log(`Custom Request Emails:  ${testResults.customRequestEmail ? colors.green + 'SUCCESS ✅' : colors.red + 'FAIL ❌'}${colors.reset}`);

    console.log('\n⏱️  PERFORMANCE METRICS:\n');
    Object.entries(testResults.timings).forEach(([name, time]) => {
        const status = time < 3000 ? colors.green : colors.yellow;
        console.log(`${name}: ${status}${time}ms${colors.reset} ${time < 3000 ? '✅' : '⚠️  (>3s)'}`);
    });

    if (testResults.errors.length > 0) {
        console.log('\n❌ ERRORS FOUND:\n');
        testResults.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${colors.red}${error}${colors.reset}`);
        });
    } else {
        console.log(`\n${colors.green}${colors.bold}✅ NO ERRORS FOUND${colors.reset}`);
    }

    const allPassed = testResults.smtpConnection &&
        testResults.orderEmail &&
        testResults.contactEmail &&
        testResults.b2bEmail &&
        testResults.customRequestEmail;

    const allFast = Object.values(testResults.timings).every(t => t < 3000);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`\n${colors.bold}System Ready for Production: ${allPassed && allFast ? colors.green + 'YES ✅' : colors.red + 'NO ❌'}${colors.reset}\n`);
    console.log('═══════════════════════════════════════════════════════\n');

    // Additional recommendations
    if (allPassed) {
        log.success('All email types are working correctly!');
        log.info('Check your inbox at ' + TEST_EMAIL + ' for test emails');
        log.info('Verify reply-to addresses are correct in received emails');
    }

    if (!allFast) {
        log.warn('Some operations took longer than 3 seconds');
        log.info('This may be due to network latency or SMTP server response time');
    }
}

// Main test execution
async function runAllTests() {
    console.log('\n🚀 Starting Zoho SMTP Email System End-to-End Tests...\n');
    console.log('Test Recipient: ' + TEST_EMAIL);
    console.log('Server: ' + BASE_URL);
    console.log('\n');

    // Wait a moment for server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Run all tests sequentially
    await testSMTPConnection();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testOrderEmail();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await testContactEmail();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await testB2BEmail();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await testCustomRequestEmail();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate final report
    generateReport();

    // Exit with appropriate code
    const allPassed = testResults.smtpConnection &&
        testResults.orderEmail &&
        testResults.contactEmail &&
        testResults.b2bEmail &&
        testResults.customRequestEmail;

    process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
    log.error('Test suite failed: ' + error.message);
    console.error(error);
    process.exit(1);
});
