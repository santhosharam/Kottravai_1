import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { Product, categories } from '@/data/products';
import { safeSetItem, safeGetItem } from '@/utils/storage';

const API_URL = `${import.meta.env.VITE_API_URL || 'https://kottravai.in/api'}/products`;
interface ProductContextType {
    products: Product[];
    addProduct: (product: Product) => Promise<void>;
    updateProduct: (product: Product) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    updateStock: (id: string, newStock: number) => void;
    addReview: (productId: string, review: any) => Promise<void>;
    categories: typeof categories;
    loading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
    const [products, setProducts] = useState<Product[]>(() => {
        // Try to load from local storage for instant initial paint
        const saved = safeGetItem('kottravai_cache_products');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return [];
            }
        }
        return [];
    });
    const [loading, setLoading] = useState(() => {
        // Only show loader if we have no cached data
        return !safeGetItem('kottravai_cache_products');
    });

    // Helper to map DB snake_case to Frontend camelCase
    const mapProductFromDB = (p: any): Product => ({
        ...p,
        id: p.id,
        categorySlug: p.category_slug || p.categorySlug,
        shortDescription: p.short_description || p.shortDescription,
        keyFeatures: p.key_features || p.keyFeatures || [],
        features: p.features || [],
        images: p.images || [],
        reviews: p.reviews || [],
        isBestSeller: p.is_best_seller || p.isBestSeller || false,
        isCustomRequest: p.is_custom_request || p.isCustomRequest || false,
        custom_form_config: p.custom_form_config || p.customFormConfig || [],
        default_form_fields: p.default_form_fields || p.defaultFormFields || [],
        variants: p.variants || []
    });

    const fetchProducts = async () => {
        try {
            const response = await axios.get(API_URL);
            const mappedProducts = response.data.map(mapProductFromDB);

            // High-Performance Check: Avoid full stringify on large payloads (base64 images found)
            const isDataDifferent = products.length !== mappedProducts.length ||
                (products.length > 0 && products[0].id !== mappedProducts[0]?.id);

            if (isDataDifferent) {
                setProducts(mappedProducts);
                // Update local storage in the background to avoid blocking the main thread
                setTimeout(() => {
                    safeSetItem('kottravai_cache_products', JSON.stringify(mappedProducts));
                    safeSetItem('kottravai_cache_time', Date.now().toString());
                }, 0);
            }
        } catch (error) {
            console.error("Failed to fetch products from API", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const addProduct = async (product: Product) => {
        try {
            const response = await axios.post(API_URL, product);
            const newProduct = mapProductFromDB(response.data);
            setProducts(prev => [...prev, newProduct]);
        } catch (error) {
            console.error("Failed to add product", error);
            throw error;
        }
    };

    const updateProduct = async (updatedProduct: Product) => {
        try {
            // API expects camelCase body as per server/index.js
            const response = await axios.put(`${API_URL}/${updatedProduct.id}`, updatedProduct);
            const mappedProduct = mapProductFromDB(response.data);

            // Should preserve reviews if the update didn't return them populated
            if (!mappedProduct.reviews && updatedProduct.reviews) {
                mappedProduct.reviews = updatedProduct.reviews;
            }

            setProducts(prev => prev.map(p => p.id === mappedProduct.id ? mappedProduct : p));
        } catch (error) {
            console.error("Failed to update product", error);
            throw error;
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error("Failed to delete product", error);
            throw error;
        }
    };

    const addReview = async (productId: string, review: any) => {
        try {
            const response = await axios.post('/api/reviews', { ...review, productId });
            const newReview = response.data;

            setProducts(prev => prev.map(p => {
                if (p.id === productId) {
                    return { ...p, reviews: [...(p.reviews || []), newReview] };
                }
                return p;
            }));
        } catch (error) {
            console.error("Failed to add review", error);
            throw error;
        }
    };

    const updateStock = (id: string, newStock: number) => {
        // Optimistic update for UI purposes, backend doesn't support stock yet
        setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
    };

    return (
        <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, updateStock, addReview, categories, loading }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};