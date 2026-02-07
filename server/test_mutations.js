const Razorpay = require('razorpay');

async function testKeys(id, secret, label) {
    console.log(`Testing combination: ${label}`);
    console.log(`ID: ${id}, Secret: ${secret}`);
    try {
        const instance = new Razorpay({ key_id: id, key_secret: secret });
        await instance.orders.create({ amount: 100, currency: "INR", receipt: "test_" + Date.now() });
        console.log(`✅ SUCCESS with ${label}!`);
        return true;
    } catch (e) {
        console.log(`❌ FAILED with ${label}`);
        return false;
    }
}

async function run() {
    const id = 'rzp_test_Rnu2QIHfb8tG2c';

    // Original (read as O)
    const s1 = 'GlOc6q8Dc916U6DG5DYF3xlp';
    // Zero
    const s2 = 'Gl0c6q8Dc916U6DG5DYF3xlp';
    // One (start) and Zero
    const s3 = 'G10c6q8Dc916U6DG5DYF3xlp';
    // lowercase I
    const s4 = 'GlOc6q8Dc916U6DG5DYF3xlp'.replace('I', 'l');

    // Also check ID variations
    const id2 = 'rzp_test_Rnu2QlHfb8tG2c'; // lowercase L instead of I

    await testKeys(id, s1, "Original");
    await testKeys(id, s2, "Secret with Zero");
    await testKeys(id2, s1, "ID with lowercase L");
    await testKeys(id2, s2, "ID with lowercase L + Secret with Zero");
}

run();
