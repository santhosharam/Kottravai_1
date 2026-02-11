const Razorpay = require('razorpay');

console.log("Testing Razorpay Keys...");

const key_id = 'rzp_test_Rnu2QIHfb8tG2c';
const key_secret = 'GlOc6q8Dc916U6DG5DYF3xlp';

console.log("Key ID:", key_id);
console.log("Key Secret:", key_secret);

try {
    const instance = new Razorpay({
        key_id: key_id,
        key_secret: key_secret
    });

    instance.orders.create({
        amount: 50000,
        currency: "INR",
        receipt: "test_receipt_1",
    })
        .then(order => {
            console.log("✅ SUCCESS! Authentication working.");
            console.log("Order ID:", order.id);
        })
        .catch(error => {
            console.error("❌ FAILURE! Authentication failed.");
            console.error(JSON.stringify(error, null, 2));
        });
} catch (e) {
    console.error("Initialization Error:", e);
}
