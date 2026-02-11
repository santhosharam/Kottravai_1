const express = require('express'); // Restart Triggered [Auth Update]
const cors = require('cors');
const db = require('./db');
const nodemailer = require('nodemailer');
const { verifyConnection } = require('./utils/mailer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import Shiprocket Service for automatic shipment creation
const shiprocketService = require('./services/shiprocketService');

// Verify SMTP connection at startup
verifyConnection().then(isConnected => {
    if (isConnected) {
        console.log('✅ Zoho SMTP ready for sending emails');
    } else {
        console.warn('⚠️  Zoho SMTP connection failed - emails may not send');
    }
});

// --- Performance Cache ---
let productCache = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute cache

const clearProductCache = () => {
    productCache = null;
    lastCacheUpdate = 0;
    console.log('🧹 Product cache cleared');
};


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to verify JWT
// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Validate key type
if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.includes('anon')) {
    console.error('❌ CRITICAL ERROR: YOUR SUPABASE_SERVICE_ROLE_KEY IS ACTUALLY AN ANON KEY.');
    console.error('   Standard anon keys cannot perform Admin actions (signup bypass).');
    console.error('   Please use the "service_role" key from Supabase Dashboard > Settings > API.');
}

// Middleware to verify Supabase Token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Authentication required' });

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw error;

        // Attach user info to request (handle both email and phone based users)
        req.user = {
            id: user.id,
            username: user.user_metadata?.username || user.phone || user.email || '',
            mobile: user.user_metadata?.mobile || user.phone?.replace(/^\+91/, '') || '',
            fullName: user.user_metadata?.full_name || ''
        };
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
    origin: true, // Reflect the request origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'x-rtb-fingerprint-id',
        'X-RTB-Fingerprint-Id',
        'razorpay_payment_id',
        'razorpay_order_id',
        'razorpay_signature'
    ],
    exposedHeaders: [
        'x-rtb-fingerprint-id',
        'X-RTB-Fingerprint-Id',
        'Content-Range',
        'X-Content-Range'
    ],
    credentials: true
}));

// Comprehensive security and dev headers
app.use((req, res, next) => {
    // Log every request to help debug 400 errors
    if (req.path !== '/api/health') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT') {
            console.log('Body:', JSON.stringify(req.body, null, 2));
        }
    }

    // Explicitly allow private network access for local tunnels (Chrome/Edge)
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.setHeader('Permissions-Policy', 'accelerometer=*, gyroscope=*, magnetometer=*, payment=*');
    next();
});

// Test Route
app.get('/api/health', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({ status: 'ok', time: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Setup DB Route (Temporary for migration)
app.get('/api/init-db', async (req, res) => {
    try {
        const schemaSql = `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        CREATE TABLE IF NOT EXISTS products (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            original_id VARCHAR(255) UNIQUE,
            name VARCHAR(255) NOT NULL,
            price INTEGER NOT NULL,
            category VARCHAR(100) NOT NULL,
            image TEXT NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            category_slug VARCHAR(100),
            short_description TEXT,
            description TEXT,
            key_features TEXT[],
            features TEXT[],
            images TEXT[],
            is_best_seller BOOLEAN DEFAULT FALSE,
            is_custom_request BOOLEAN DEFAULT FALSE,
            custom_form_config JSONB,
            default_form_fields JSONB,
            variants JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Ensure column exists if table already existed (Migration)
        DO $$ 
        BEGIN 
            BEGIN
                ALTER TABLE products ADD COLUMN is_best_seller BOOLEAN DEFAULT FALSE;
            EXCEPTION
                WHEN duplicate_column THEN NULL;
            END;
            BEGIN
                ALTER TABLE products ADD COLUMN is_custom_request BOOLEAN DEFAULT FALSE;
            EXCEPTION
                WHEN duplicate_column THEN NULL;
            END;
            BEGIN
                ALTER TABLE products ADD COLUMN custom_form_config JSONB;
            EXCEPTION
                WHEN duplicate_column THEN NULL;
            END;
            BEGIN
                ALTER TABLE products ADD COLUMN default_form_fields JSONB;
            EXCEPTION
                WHEN duplicate_column THEN NULL;
            END;
            BEGIN
                ALTER TABLE products ADD COLUMN variants JSONB;
            EXCEPTION
                WHEN duplicate_column THEN NULL;
            END;
        END $$;

        CREATE TABLE IF NOT EXISTS reviews (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            product_id UUID REFERENCES products(id) ON DELETE CASCADE,
            user_name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(20),
            address TEXT,
            city VARCHAR(100),
            pincode VARCHAR(20),
            total DECIMAL(10, 2) NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            items JSONB NOT NULL,
            payment_id VARCHAR(255),
            order_id VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
        CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
        CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

        CREATE TABLE IF NOT EXISTS wishlist (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_email VARCHAR(255) NOT NULL,
            product_id UUID REFERENCES products(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_email, product_id)
        );
        CREATE INDEX IF NOT EXISTS idx_wishlist_user_email ON wishlist(user_email);
        `;

        await db.query(schemaSql);
        res.json({ message: 'Database initialized successfully', status: 'ok' });
    } catch (err) {
        console.error('Migration failed:', err);
        res.status(500).json({ error: err.message });
    }
});

// Products Routes
app.get('/api/products', async (req, res) => {
    try {
        const now = Date.now();
        // Return cached data if it's still fresh
        if (productCache && (now - lastCacheUpdate < 600000)) { // 10 minutes cache
            console.log('⚡ Serving products from cache');
            return res.json(productCache);
        }

        console.log('🔍 Fetching products from database...');
        // Optimized query: Subquery for reviews is much faster than LEFT JOIN + GROUP BY for large datasets
        const query = `
            SELECT p.*, 
            (
                SELECT COALESCE(json_agg(r_agg), '[]')
                FROM (
                    SELECT 
                        id, 
                        product_id as "productId", 
                        user_name as "userName", 
                        email, 
                        rating, 
                        comment, 
                        date 
                    FROM reviews 
                    WHERE product_id = p.id
                    ORDER BY date DESC
                ) r_agg
            ) as reviews
            FROM products p
            ORDER BY p.created_at DESC
        `;

        const result = await db.query(query);

        // Update Cache
        productCache = result.rows;
        lastCacheUpdate = now;

        res.json(result.rows);
    } catch (err) {
        console.error('❌ Products Fetch Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await db.query('SELECT * FROM products WHERE slug = $1', [slug]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const product = result.rows[0];
        // Fetch reviews with camelCase keys
        const reviewsQuery = `
            SELECT id, product_id as "productId", user_name as "userName", email, rating, comment, date
            FROM reviews 
            WHERE product_id = $1
        `;
        const reviewsResult = await db.query(reviewsQuery, [product.id]);
        product.reviews = reviewsResult.rows;

        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Product
app.post('/api/products', async (req, res) => {
    console.log('📝 Received Create Product Request');
    console.log('Body:', req.body);
    try {
        const {
            name, price, category, image, slug, categorySlug,
            shortDescription, description, keyFeatures, features, images, isBestSeller,
            isCustomRequest, customFormConfig, defaultFormFields, variants
        } = req.body;

        const query = `
            INSERT INTO products (
                name, price, category, image, slug,
                category_slug, short_description, description,
                key_features, features, images, is_best_seller,
                is_custom_request, custom_form_config, default_form_fields, variants
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
        `;

        const values = [
            name, price, category, image, slug,
            categorySlug, shortDescription, description,
            keyFeatures, features, images, isBestSeller || false,
            isCustomRequest || false,
            customFormConfig ? JSON.stringify(customFormConfig) : null,
            defaultFormFields ? JSON.stringify(defaultFormFields) : null,
            variants ? JSON.stringify(variants) : null
        ];

        const result = await db.query(query, values);
        console.log('✅ Product Inserted:', result.rows[0]);
        clearProductCache(); // Cache invalidation
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ Error creating product:', err);
        const fs = require('fs');
        fs.appendFileSync('error.log', `[${new Date().toISOString()}] Error creating product: ${err.message}\n${err.stack}\n`);
        res.status(500).json({ error: err.message });
    }
});

// Update Product
app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, price, category, image, slug, categorySlug,
            shortDescription, description, keyFeatures, features, images, isBestSeller,
            isCustomRequest, customFormConfig, defaultFormFields, variants
        } = req.body;

        const query = `
            UPDATE products SET
                name = $1, price = $2, category = $3, image = $4, slug = $5, 
                category_slug = $6, short_description = $7, description = $8, 
                key_features = $9, features = $10, images = $11, is_best_seller = $12,
                is_custom_request = $13, custom_form_config = $14, default_form_fields = $15,
                variants = $16
            WHERE id = $17
            RETURNING *
        `;

        const values = [
            name, price, category, image, slug,
            categorySlug, shortDescription, description,
            keyFeatures, features, images, isBestSeller || false,
            isCustomRequest || false,
            customFormConfig ? JSON.stringify(customFormConfig) : null,
            defaultFormFields ? JSON.stringify(defaultFormFields) : null,
            variants ? JSON.stringify(variants) : null,
            id
        ];

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        clearProductCache(); // Cache invalidation
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        clearProductCache(); // Cache invalidation
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Review
app.post('/api/reviews', async (req, res) => {
    try {
        const { productId, userName, email, rating, comment, date } = req.body;

        const query = `
            INSERT INTO reviews (product_id, user_name, email, rating, comment, date)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const values = [productId, userName, email, rating, comment, date];
        const result = await db.query(query, values);

        const returnedReview = result.rows[0];
        // Map back to camelCase for frontend
        const reviewResponse = {
            id: returnedReview.id,
            productId: returnedReview.product_id,
            userName: returnedReview.user_name,
            email: returnedReview.email,
            rating: returnedReview.rating,
            comment: returnedReview.comment,
            date: returnedReview.date
        };

        res.status(201).json(reviewResponse);
        clearProductCache(); // Reviews are part of product data
    } catch (err) {
        console.error('Error adding review:', err);
        res.status(500).json({ error: err.message });
    }
});

// Orders Routes

app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const {
            customerName, customerEmail, customerPhone, address, city,
            pincode, total, items, paymentId, orderId
        } = req.body;

        // Ensure the phone is anchored to the authenticated user if possible
        const storedPhone = req.user.mobile || customerPhone;

        const query = `
            INSERT INTO orders (
                customer_name, customer_email, customer_phone, address, city,
                pincode, total, items, payment_id, order_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;

        const values = [
            customerName, customerEmail, storedPhone, address, city,
            pincode, total, JSON.stringify(items), paymentId, orderId
        ];

        const result = await db.query(query, values);
        const row = result.rows[0];

        res.status(201).json({
            id: row.id,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            customerPhone: row.customer_phone,
            address: row.address,
            city: row.city,
            pincode: row.pincode,
            total: parseFloat(row.total),
            status: row.status,
            items: row.items,
            paymentId: row.payment_id,
            orderId: row.order_id,
            date: row.created_at
        });

        // --- EMAIL NOTIFICATION LOGIC ---
        try {
            const adminEmail = 'admin@kottravai.in';


            const orderData = {
                orderId: row.order_id,
                customerName: row.customer_name,
                customerEmail: row.customer_email,
                customerPhone: row.customer_phone,
                address: row.address,
                city: row.city,
                pincode: row.pincode,
                total: parseFloat(row.total),
                items: JSON.parse(JSON.stringify(items)),
                paymentId: row.payment_id
            };

            // Send emails with proper reply-to routing
            await Promise.all([
                sendEmail({
                    to: adminEmail,
                    subject: `New Order Received #${orderId} - ${customerName}`,
                    html: getOrderAdminTemplate(orderData),
                    type: 'order'
                }),
                sendEmail({
                    to: customerEmail,
                    subject: `Order Confirmation - #${orderId}`,
                    html: getOrderUserTemplate(orderData),
                    type: 'order'
                })
            ]);
            console.log(`✅ Order confirmation emails sent for Order #${orderId}`);
        } catch (emailErr) {
            console.error('❌ Failed to send order confirmation emails:', emailErr);
            // Don't block the response, just log the error
        }

        // --- SHIPROCKET INTEGRATION ---
        try {
            console.log(`🚀 Initiating Shiprocket Order Creation for Order #${orderId}`);

            // STEP 2: Strict phone sanitization for Shiprocket API
            let sanitizedPhone = row.customer_phone || "9999999999";

            // Remove all non-numeric characters (+91, spaces, dashes, etc.)
            sanitizedPhone = sanitizedPhone.toString().replace(/\D/g, "");

            // Keep only last 10 digits (removes country code if present)
            sanitizedPhone = sanitizedPhone.slice(-10);

            // Validate: must be exactly 10 digits
            if (sanitizedPhone.length !== 10) {
                console.warn(`⚠️  Invalid phone length (${sanitizedPhone.length}), using fallback`);
                sanitizedPhone = "9999999999";
            }

            // Debug log
            console.log(`📞 Original Phone: ${row.customer_phone}`);
            console.log(`📦 Shiprocket Phone Used: ${sanitizedPhone}`);

            // Prepare Shiprocket order data
            const shiprocketOrderData = {
                orderId: row.order_id,
                orderDate: new Date().toISOString().split('T')[0],

                customer: {
                    firstName: row.customer_name.split(' ')[0] || row.customer_name,
                    lastName: row.customer_name.split(' ').slice(1).join(' ') || '',
                    email: row.customer_email,
                    phone: sanitizedPhone, // Use sanitized phone
                    address: row.address,
                    city: row.city,
                    state: 'Tamil Nadu', // Default state, should be collected from frontend
                    pincode: row.pincode,
                    country: 'India',
                },

                items: items.map(item => ({
                    id: item.id,
                    name: item.name,
                    sku: item.sku || `SKU-${item.id}`,
                    quantity: item.quantity,
                    price: item.price,
                })),

                payment: {
                    method: 'prepaid', // All Razorpay orders are prepaid
                },

                dimensions: {
                    length: 10,
                    breadth: 10,
                    height: 10,
                    weight: 0.5,
                },
            };

            // Create order in Shiprocket
            console.log('✅ Shiprocket Authenticating...');
            const shipmentResult = await shiprocketService.createOrder(shiprocketOrderData);

            console.log('📦 Shiprocket Order Created Successfully');
            console.log(`🆔 Shiprocket Order ID: ${shipmentResult.orderId}`);
            console.log(`🚚 Shipment ID: ${shipmentResult.shipmentId}`);

            // Update database with Shiprocket details
            await db.query(
                `UPDATE orders 
                 SET shiprocket_order_id = $1, shipment_id = $2 
                 WHERE id = $3`,
                [shipmentResult.orderId, shipmentResult.shipmentId, row.id]
            );

            console.log(`✅ Database updated with Shiprocket details for Order #${orderId}`);

        } catch (shiprocketErr) {
            console.error('❌ Failed to create Shiprocket order:', shiprocketErr.message);
            console.error('⚠️  Order saved successfully but shipment creation failed');
            console.error('⚠️  Manual shipment creation required for Order #' + orderId);
            // Don't block the response - order is saved, shipment can be created manually
        }
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        // Admin Access Bypass
        const adminSecret = req.headers['x-admin-secret'];
        if (adminSecret && adminSecret === (process.env.ADMIN_PASSWORD || 'admin123')) {
            const query = 'SELECT * FROM orders ORDER BY created_at DESC';
            const result = await db.query(query);
            return res.json(result.rows.map(row => ({
                id: row.id,
                orderId: row.order_id,
                customerName: row.customer_name,
                customerEmail: row.customer_email,
                customerPhone: row.customer_phone,
                total: parseFloat(row.total),
                status: row.status,
                date: row.created_at,
                items: row.items,
                paymentId: row.payment_id
            })));
        }

        // Standard User Access (Requires Token)
        authenticateToken(req, res, async () => {
            const mobile = req.user.mobile;
            if (!mobile) return res.json([]);

            const sanitizedPhone = mobile.replace(/\D/g, "").slice(-10);
            if (!sanitizedPhone || sanitizedPhone.length < 10) return res.json([]);

            const query = 'SELECT * FROM orders WHERE customer_phone LIKE $1 ORDER BY created_at DESC';
            const params = [`%${sanitizedPhone}`];

            const result = await db.query(query, params);
            res.json(result.rows.map(row => ({
                id: row.id,
                orderId: row.order_id,
                customerName: row.customer_name,
                customerEmail: row.customer_email,
                customerPhone: row.customer_phone,
                total: parseFloat(row.total),
                status: row.status,
                date: row.created_at,
                items: row.items,
                paymentId: row.payment_id
            })));
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.put('/api/orders/:id', async (req, res) => {
    try {
        const adminSecret = req.headers['x-admin-secret'];
        if (!adminSecret || adminSecret !== (process.env.ADMIN_PASSWORD || 'admin123')) {
            return res.status(403).json({ error: 'Unauthorized admin access' });
        }

        const { id } = req.params;
        const { status } = req.body;

        const result = await db.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const row = result.rows[0];
        res.json({
            id: row.id,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            status: row.status
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        const adminSecret = req.headers['x-admin-secret'];
        if (!adminSecret || adminSecret !== (process.env.ADMIN_PASSWORD || 'admin123')) {
            return res.status(403).json({ error: 'Unauthorized admin access' });
        }

        const { id } = req.params;
        const result = await db.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Wishlist Routes
app.get('/api/wishlist', authenticateToken, async (req, res) => {
    try {
        const username = req.user.username;

        const query = `
            SELECT p.* 
            FROM products p
            JOIN wishlist w ON p.id = w.product_id
            WHERE w.username = $1
            ORDER BY w.created_at DESC
        `;
        const result = await db.query(query, [username]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/wishlist/toggle', authenticateToken, async (req, res) => {
    try {
        const username = req.user.username;
        const { productId } = req.body;
        if (!productId) return res.status(400).json({ error: 'Product ID is required' });

        // Check if exists
        const check = await db.query('SELECT * FROM wishlist WHERE username = $1 AND product_id = $2', [username, productId]);

        if (check.rows.length > 0) {
            // Remove
            await db.query('DELETE FROM wishlist WHERE username = $1 AND product_id = $2', [username, productId]);
            res.json({ status: 'removed' });
        } else {
            // Add
            await db.query('INSERT INTO wishlist (username, product_id) VALUES ($1, $2)', [username, productId]);
            res.json({ status: 'added' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// B2B Inquiry Email
const { sendEmail } = require('./utils/mailer');
const {
    getB2BAdminTemplate,
    getB2BUserTemplate,
    getContactAdminTemplate,
    getContactUserTemplate,
    getOrderAdminTemplate,
    getOrderUserTemplate
} = require('./utils/emailTemplates');


app.post('/api/b2b-inquiry', async (req, res) => {
    try {
        const { name, email, phone, company, location, products, quantity, notes } = req.body;

        const adminEmail = 'admin@kottravai.in';


        // Send emails with B2B reply-to routing
        await Promise.all([
            sendEmail({
                to: adminEmail,
                subject: `New B2B Inquiry from ${name} - ${company || 'Individual'}`,
                html: getB2BAdminTemplate(req.body),
                type: 'b2b'
            }),
            sendEmail({
                to: email,
                subject: 'Thank you for contacting Kottravai B2B',
                html: getB2BUserTemplate(req.body),
                type: 'b2b'
            })
        ]);

        res.json({ status: 'success', message: 'Inquiry sent successfully' });

    } catch (error) {
        console.error('B2B Email Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send email. Please try again later.' });
    }
});

// Custom Request Inquiry Email
app.post('/api/custom-request', async (req, res) => {
    try {
        const { name, email, phone, requestedText, referenceImage, customFields, productName, allFields } = req.body;

        const adminEmail = 'admin@kottravai.in';


        // Construct dynamic fields HTML
        let fieldsHtml = '';
        if (allFields && Array.isArray(allFields)) {
            fieldsHtml = allFields.map(f => `
                <div style="margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                    <strong style="color: #2D1B4E;">${f.label}:</strong>
                    <div style="margin-top: 5px; color: #555;">${f.value || 'N/A'}</div>
                </div>
            `).join('');
        }

        const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #2D1B4E; border-bottom: 2px solid #8E2A8B; padding-bottom: 10px;">Customization Inquiry</h2>
                <p>You received a new customization request for <strong>${productName}</strong>.</p>
                
                <div style="margin-top: 20px;">
                    ${fieldsHtml}
                </div>

                ${referenceImage ? `
                <div style="margin-top: 20px;">
                    <strong style="color: #2D1B4E;">Reference Image:</strong>
                    <div style="margin-top: 10px;">
                        <img src="${referenceImage}" alt="Reference" style="max-width: 100%; border-radius: 8px; border: 1px solid #eee;" />
                    </div>
                </div>
                ` : ''}

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                    This inquiry was sent from the Kottravai Product Details page.
                </div>
            </div>
        `;

        await sendEmail({
            to: adminEmail,
            subject: `New Customization Request: ${productName}`,
            html: htmlContent,
            type: 'custom'
        });

        res.json({ status: 'success', message: 'Custom request sent successfully' });

    } catch (error) {
        console.error('Custom Request Email Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send request.' });
    }
});

// Contact Form Email
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        const adminEmail = 'admin@kottravai.in';


        // Send emails with support reply-to routing
        await Promise.all([
            sendEmail({
                to: adminEmail,
                subject: `New Contact Submission: ${subject || 'General Inquiry'}`,
                html: getContactAdminTemplate(req.body),
                type: 'contact'
            }),
            sendEmail({
                to: email,
                subject: `We Received Your Message - Kottravai`,
                html: getContactUserTemplate(req.body),
                type: 'contact'
            })
        ]);

        res.json({ status: 'success', message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact Email Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send message.' });
    }
});

// --- OTP Verification Routes ---
// Use these to verify mobile before Supabase signup

app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { mobile } = req.body;
        if (!mobile || mobile.length !== 10) {
            return res.status(400).json({ message: 'Invalid mobile number' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await db.query(
            'INSERT INTO otps (mobile, otp, expires_at) VALUES ($1, $2, $3)',
            [mobile, otp, expiresAt]
        );

        console.log(`\n📱 [OTP SENT] To: ${mobile} | Code: ${otp}\n`);
        res.json({ message: 'OTP sent' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { mobile, otp } = req.body;
        const result = await db.query(
            'SELECT * FROM otps WHERE mobile = $1 AND otp = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [mobile, otp]
        );

        if (result.rows.length > 0) {
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, mobile, fullName } = req.body;

        // Ensure phone is in E.164 format (+91 for India)
        const formattedPhone = mobile.startsWith('+') ? mobile : `+91${mobile}`;

        // Create user with direct error handling (bypass listUsers pagination issues)
        // Use a virtual email to bypass "Phone provider disabled" issue in Supabase
        const virtualEmail = `${formattedPhone.replace('+', '')}@mobile.internal`;

        const { data, error } = await supabase.auth.admin.createUser({
            email: virtualEmail,
            password,
            email_confirm: true, // AUTO-CONFIRM
            user_metadata: {
                username,
                mobile,
                full_name: fullName
            }
        });

        if (error) throw error;
        res.status(201).json({ user: data.user });
    } catch (err) {
        console.error('Registration Error Details:', err);
        let errorMessage = err.message || 'Registration failed';

        // Handle specific Supabase Auth Errors
        if (err.code === 'phone_exists' || err.status === 422 && err.message?.includes('phone')) {
            errorMessage = "This mobile number is already registered. Please login instead.";
        } else if (err.code === 'email_exists' || err.message?.includes('already registered')) {
            errorMessage = "This username or email is already taken.";
        }

        // Specific check for Service Role Key issues
        if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.includes('anon')) {
            errorMessage = "Server Error: Service Role Key is incorrect. Please contact administrator (Needs Service Role key, not Anon key).";
        }

        res.status(400).json({ error: errorMessage });
    }
});

// --- Authentication Routes Removed (Supabase Handles This) ---

// --- End Auth Routes ---

// Razorpay Integration
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
// NOTE: Using environment variables for keys is recommended
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

app.post('/api/razorpay/order', async (req, res) => {
    try {
        const { amount, currency } = req.body;
        console.log(`💳 Creating Razorpay order: Amount=${amount}, Currency=${currency || 'INR'}`);

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount. Must be a positive number." });
        }

        const options = {
            amount: Math.round(amount * 100), // Ensure integer (paise)
            currency: currency || "INR",
            receipt: "order_rcptid_" + Date.now()
        };

        const order = await razorpay.orders.create(options);
        console.log(`✅ Razorpay order created: ${order.id}`);
        res.json(order);
    } catch (error) {
        console.error("❌ Razorpay Order Creation Failed:", error);
        res.status(500).json({
            error: error.description || error.message || "Failed to initiate payment with Razorpay",
            details: error
        });
    }
});

app.post('/api/razorpay/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        console.log("Verifying payment for Order ID:", razorpay_order_id);

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        console.log("Expected Signature:", expectedSign);
        console.log("Received Signature:", razorpay_signature);

        if (razorpay_signature === expectedSign) {
            console.log("✅ Payment verification success!");
            res.json({ status: "success", message: "Payment verified successfully" });
        } else {
            console.error("❌ Payment verification failed: Signature mismatch");
            res.json({ status: "failure", message: "Invalid signature sent!" });
        }
    } catch (error) {
        console.error("Error during verification:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});
if (process.env.NODE_ENV !== 'production') {
    // Auto-migration to ensure schema matches code
    const runMigrations = async () => {
        try {
            console.log('🔄 Running database migrations...');
            // Add is_best_seller column if missing
            await db.query(`
                DO $$ 
                BEGIN 
                    BEGIN
                        ALTER TABLE products ADD COLUMN is_best_seller BOOLEAN DEFAULT FALSE;
                    EXCEPTION
                        WHEN duplicate_column THEN NULL;
                    END;
                    BEGIN
                        ALTER TABLE products ADD COLUMN is_custom_request BOOLEAN DEFAULT FALSE;
                    EXCEPTION
                        WHEN duplicate_column THEN NULL;
                    END;
                    BEGIN
                        ALTER TABLE products ADD COLUMN custom_form_config JSONB;
                    EXCEPTION
                        WHEN duplicate_column THEN NULL;
                    END;
                    BEGIN
                        ALTER TABLE products ADD COLUMN default_form_fields JSONB;
                    EXCEPTION
                        WHEN duplicate_column THEN NULL;
                    END;
                    BEGIN
                        ALTER TABLE products ADD COLUMN variants JSONB;
                    EXCEPTION
                        WHEN duplicate_column THEN NULL;
                    END;

                -- Wishlist Migration: Check for username column, rename legacy user_email if it exists
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wishlist') THEN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlist' AND column_name = 'username') THEN
                        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlist' AND column_name = 'user_email') THEN
                            ALTER TABLE wishlist RENAME COLUMN user_email TO username;
                        ELSE
                            ALTER TABLE wishlist ADD COLUMN username VARCHAR(255);
                        END IF;
                    END IF;
                END IF;
            END $$;

            CREATE TABLE IF NOT EXISTS wishlist (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                username VARCHAR(255) NOT NULL,
                product_id UUID REFERENCES products(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(username, product_id)
            );

            CREATE INDEX IF NOT EXISTS idx_wishlist_username ON wishlist(username);

            CREATE TABLE IF NOT EXISTS otps (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                mobile VARCHAR(20) NOT NULL,
                otp VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_otps_mobile ON otps(mobile);
        `);
            console.log('✅ Migrations completed: Database is up to date');
        } catch (err) {
            console.error('❌ Migration warning:', err.message);
        }
    };

    runMigrations();
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
