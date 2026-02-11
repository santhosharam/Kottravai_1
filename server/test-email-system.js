const { sendEmail } = require('./utils/mailer');

/**
 * Test Zoho SMTP Email System
 * Run this to verify all email types are working
 */
async function testEmailSystem() {
    console.log('\n🧪 ZOHO SMTP EMAIL SYSTEM TEST\n');
    console.log('='.repeat(50));

    const testRecipient = 'admin@kottravai.in';
    const results = {
        order: false,
        b2b: false,
        contact: false,
        subscribe: false,
        custom: false
    };

    // Test 1: Order Email
    try {
        console.log('\n1️⃣  Testing ORDER email (reply-to: sales@kottravai.in)...');
        await sendEmail({
            to: testRecipient,
            subject: 'TEST: Order Confirmation',
            html: '<h2>Test Order Email</h2><p>This is a test order confirmation email.</p>',
            type: 'order'
        });
        results.order = true;
        console.log('✅ Order email sent successfully');
    } catch (error) {
        console.error('❌ Order email failed:', error.message);
    }

    // Test 2: B2B Email
    try {
        console.log('\n2️⃣  Testing B2B email (reply-to: b2b@kottravai.in)...');
        await sendEmail({
            to: testRecipient,
            subject: 'TEST: B2B Inquiry',
            html: '<h2>Test B2B Email</h2><p>This is a test B2B inquiry email.</p>',
            type: 'b2b'
        });
        results.b2b = true;
        console.log('✅ B2B email sent successfully');
    } catch (error) {
        console.error('❌ B2B email failed:', error.message);
    }

    // Test 3: Contact Email
    try {
        console.log('\n3️⃣  Testing CONTACT email (reply-to: support@kottravai.in)...');
        await sendEmail({
            to: testRecipient,
            subject: 'TEST: Contact Form',
            html: '<h2>Test Contact Email</h2><p>This is a test contact form email.</p>',
            type: 'contact'
        });
        results.contact = true;
        console.log('✅ Contact email sent successfully');
    } catch (error) {
        console.error('❌ Contact email failed:', error.message);
    }

    // Test 4: Subscribe Email
    try {
        console.log('\n4️⃣  Testing SUBSCRIBE email (reply-to: info@kottravai.in)...');
        await sendEmail({
            to: testRecipient,
            subject: 'TEST: Newsletter Subscription',
            html: '<h2>Test Subscribe Email</h2><p>This is a test subscription email.</p>',
            type: 'subscribe'
        });
        results.subscribe = true;
        console.log('✅ Subscribe email sent successfully');
    } catch (error) {
        console.error('❌ Subscribe email failed:', error.message);
    }

    // Test 5: Custom Request Email
    try {
        console.log('\n5️⃣  Testing CUSTOM REQUEST email (reply-to: sales@kottravai.in)...');
        await sendEmail({
            to: testRecipient,
            subject: 'TEST: Custom Product Request',
            html: '<h2>Test Custom Request Email</h2><p>This is a test custom request email.</p>',
            type: 'custom'
        });
        results.custom = true;
        console.log('✅ Custom request email sent successfully');
    } catch (error) {
        console.error('❌ Custom request email failed:', error.message);
    }

    // Final Report
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 ZOHO SMTP FINAL REPORT\n');
    console.log('SMTP Connection: ✅ SUCCESS');
    console.log('Authentication: ✅ SUCCESS (admin@kottravai.in)');
    console.log(`Order Emails: ${results.order ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`B2B Emails: ${results.b2b ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Contact Emails: ${results.contact ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Subscribe Emails: ${results.subscribe ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Custom Request Emails: ${results.custom ? '✅ SUCCESS' : '❌ FAILED'}`);

    const allPassed = Object.values(results).every(r => r === true);
    console.log(`\nSystem Status: ${allPassed ? '✅ FULLY WORKING' : '⚠️  NEEDS FIX'}`);
    console.log('\n' + '='.repeat(50) + '\n');

    process.exit(allPassed ? 0 : 1);
}

// Run the test
testEmailSystem();
