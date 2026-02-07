// Review Interface
export interface Review {
    id: string;
    userName: string;
    email?: string; // Added to match UI
    rating: number; // 1-5
    comment: string;
    date: string; // ISO string
}

// Product Variant Interface
export interface ProductVariant {
    weight: string;
    price: number;
    images?: string[];
}

// Product Interface
export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    image: string;
    slug: string;
    categorySlug?: string;
    shortDescription?: string;
    description?: string;
    keyFeatures?: string[];
    features?: string[]; // Specifications (Key: Value)
    images?: string[];
    reviews?: Review[]; // Array of reviews
    stock?: number;
    isBestSeller?: boolean;
    isCustomRequest?: boolean;
    defaultFormFields?: Array<{
        id: string;
        label: string;
        placeholder?: string;
        type: 'text' | 'email' | 'tel' | 'file' | 'textarea' | 'number';
        required: boolean;
        isDefault: boolean;
    }>;
    customFormConfig?: Array<{
        id: string;
        label: string;
        type: 'text' | 'textarea' | 'number';
        placeholder?: string;
        required?: boolean;
    }>;
    variants?: ProductVariant[];
}

// Sample product to visualize changes immediately
export const products: Product[] = [
    {
        id: '1',
        name: 'Handcrafted Coconut Shell Cup',
        price: 450,
        category: 'Coco Crafts',
        categorySlug: 'coco-crafts',
        image: 'https://images.unsplash.com/photo-1596436065565-dfc49cb376dc?auto=format&fit=crop&q=80&w=800',
        slug: 'handcrafted-coconut-shell-cup',
        shortDescription: 'Eco-friendly, sustainable, and handcrafted coconut shell cup perfect for your daily beverages.',
        description: 'Experience the rustic charm of nature with our Handcrafted Coconut Shell Cup. Meticulously polished and treated with natural oils, this cup is not just a vessel but a piece of art. It is perfect for serving herbal teas, coffee, or even cool refreshing drinks. Being 100% natural, it adds an earthy touch to your kitchen collection.',
        keyFeatures: [
            'Made from 100% natural and reclaimed coconut shells',
            'Handcrafted by skilled rural artisans',
            'Comes with a fitted lid and curved natural handle',
            'Stable round base for safe placement',
            'Eco-friendly, biodegradable & plastic-free',
            'Lightweight, durable & sustainably sourced',
            'Ideal for serving herbal drinks, water, and traditional beverages',
            'Perfect as rustic kitchen décor or handmade gifting',
            'Retains natural coconut shell patterns for an authentic look'
        ],
        features: [
            'Material: 100% Natural Coconut Shell',
            'Capacity: 250ml - 300ml (Approx)',
            'Finish: Polished with Natural Coconut Oil',
            'Weight: 150g',
            'Care Instructions: Hand wash only, do not use in microwave'
        ],
        images: [
            'https://images.unsplash.com/photo-1628102491629-778571d893a3?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1614737662709-64eb772d1742?auto=format&fit=crop&q=80&w=800'
        ],
        reviews: []
    }
];

export const categories = [
    // --- Parent Categories ---
    { name: 'Handicrafts', count: 0, slug: 'handicrafts' },
    { name: 'Heritage Mixes', count: 0, slug: 'heritage-mixes' },
    { name: 'Instant Nourish', count: 0, slug: 'instant-nourish' },
    { name: 'Essential Care', count: 0, slug: 'essential-care' },
    { name: 'Gift Hampers', count: 0, slug: 'gift-hampers' },
    { name: 'Signature Kits', count: 0, slug: 'signature-kits' },

    // --- Sub Categories: Handicrafts ---
    { name: 'Coco Crafts', count: 0, slug: 'coco-crafts', parent: 'handicrafts' },
    { name: 'Terracotta Ornaments', count: 0, slug: 'terracotta-ornaments', parent: 'handicrafts' },
    { name: 'Banana Fibre Essentials', count: 0, slug: 'banana-fibre-essentials', parent: 'handicrafts' },
    { name: 'Handwoven Crochet', count: 0, slug: 'handwoven-crochet', parent: 'handicrafts' },

    // --- Sub Categories: Heritage Mixes ---
    { name: 'Daily Idly Mix', count: 0, slug: 'daily-idly-mix', parent: 'heritage-mixes' },
    { name: 'Tasty Dosa Mix', count: 0, slug: 'tasty-dosa-mix', parent: 'heritage-mixes' },
    { name: 'Wholesome Rice Mix', count: 0, slug: 'wholesome-rice-mix', parent: 'heritage-mixes' },

    // --- Sub Categories: Instant Nourish ---
    { name: 'Shakthimaan', count: 0, slug: 'shakthimaan', parent: 'instant-nourish' },
    { name: 'Crawl Booster', count: 0, slug: 'crawl-booster', parent: 'instant-nourish' },
    { name: 'Choco Blast', count: 0, slug: 'choco-blast', parent: 'instant-nourish' },

    // --- Sub Categories: Essential Care ---
    { name: 'Heal Soap', count: 0, slug: 'heal-soap', parent: 'essential-care' },
    { name: 'Charcoal Soap', count: 0, slug: 'charcoal-soap', parent: 'essential-care' },
    { name: 'Skin Glow Soap', count: 0, slug: 'skin-glow-soap', parent: 'essential-care' },

    // --- Sub Categories: Gift Hampers ---
    { name: 'Executive Desk Gifts Set', count: 0, slug: 'executive-desk-gifts-set', parent: 'gift-hampers' },
    { name: 'Wellness & Living Set', count: 0, slug: 'wellness-living-set', parent: 'gift-hampers' },
    { name: 'Heritage & Culture Gift Set', count: 0, slug: 'heritage-culture-gift-set', parent: 'gift-hampers' },
    { name: 'Festival & Celebration Gift Set', count: 0, slug: 'festival-celebration-gift-set', parent: 'gift-hampers' },
    { name: 'Hamper of Love', count: 0, slug: 'hamper-of-love', parent: 'gift-hampers' },
    { name: 'Anniversary Hamper', count: 0, slug: 'anniversary-hamper', parent: 'gift-hampers' },

    // --- Sub Categories: Signature Kits ---
    { name: 'Happy Journey Kit', count: 0, slug: 'happy-journey-kit', parent: 'signature-kits' },
    { name: 'Bachelor Kit', count: 0, slug: 'bachelor-kit', parent: 'signature-kits' },
    { name: 'Working Women Kit', count: 0, slug: 'working-women-kit', parent: 'signature-kits' }
];
