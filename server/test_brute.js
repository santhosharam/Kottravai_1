const Razorpay = require('razorpay');

async function testKeys(id, secret, label) {
    try {
        const instance = new Razorpay({ key_id: id, key_secret: secret });
        await instance.orders.create({ amount: 100, currency: "INR", receipt: "test_" + Date.now() });
        console.log(`✅ SUCCESS with ${label}!`);
        console.log(`ID: ${id}`);
        console.log(`Secret: ${secret}`);
        return true;
    } catch (e) {
        // console.log(`❌ ${label} failed`);
        return false;
    }
}

async function run() {
    console.log("Brute-forcing common OCR confusions...");

    // Base Guesses from image
    const baseId = 'rzp_test_Rnu2QIHfb8tG2c';
    const baseSecret = 'GlOc6q8Dc916U6DG5DYF3xlp';

    // Confusion Sets
    const idVariations = [
        baseId,
        baseId.replace('I', 'l'), // Replace I with lowercase L
        baseId.replace('I', '1'), // Replace I with One
    ];

    // Secret contains 'GlOc' and '916'
    // 'l' could be 'I' (capital i), '1' (one)
    // 'O' could be '0' (zero)
    // 'q' could be '9'? No looks like q.

    const s_l_opts = ['l', 'I', '1'];
    const s_O_opts = ['O', '0'];

    const secretVariations = [];

    for (const l_char of s_l_opts) {
        for (const O_char of s_O_opts) {
            // Construct secret: G + l_char + O_char + c6q8Dc916U6DG5DYF3xlp
            // Note: There might be other confusions downstream?
            // "916" -> The 1 could be l or I
            // "xlp" -> The l could be I or 1

            let s = `G${l_char}${O_char}c6q8Dc916U6DG5DYF3xlp`;
            secretVariations.push(s);

            // Also try mutating the "916" part?
            // Let's assume numbers are numbers for now.

            // Try mutating the 'l' in 'xlp' at the end
            let s2 = s.slice(0, -2) + 'I' + s.slice(-1);
            secretVariations.push(s2);
        }
    }

    // Brute force all pairs
    for (const id of idVariations) {
        for (const secret of secretVariations) {
            if (await testKeys(id, secret, "Attempt")) {
                console.log(`FOUND_KEY_ID:${id}`);
                console.log(`FOUND_KEY_SECRET:${secret}`);
                return;
            }
        }
    }

    console.log("⚠️ All brute force attempts failed.");
}

run();
