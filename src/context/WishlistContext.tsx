import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product } from '@/data/products';
import { useAuth } from './AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface WishlistContextType {
    wishlist: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: string) => void;
    toggleWishlist: (product: Product) => void;
    isInWishlist: (productId: string) => boolean;
    wishlistCount: number;
    loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
    const { user, isAuthenticated } = useAuth();
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch wishlist from server
    const fetchWishlist = useCallback(async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/wishlist?email=${user.email}`);
            setWishlist(response.data);
        } catch (error) {
            console.error("Failed to fetch wishlist", error);
        } finally {
            setLoading(false);
        }
    }, [user?.email]);

    // Handle initial load and sync
    useEffect(() => {
        if (isAuthenticated && user?.email) {
            fetchWishlist();
        } else {
            // Guest mode: load from localStorage
            const storedWishlist = localStorage.getItem('kottravai_wishlist');
            if (storedWishlist) {
                try {
                    setWishlist(JSON.parse(storedWishlist));
                } catch (error) {
                    console.error("Failed to parse wishlist", error);
                }
            } else {
                setWishlist([]);
            }
        }
    }, [isAuthenticated, user?.email, fetchWishlist]);

    // Save Guest wishlist to local storage
    useEffect(() => {
        if (!isAuthenticated) {
            localStorage.setItem('kottravai_wishlist', JSON.stringify(wishlist));
        }
    }, [wishlist, isAuthenticated]);

    const toggleWishlist = async (product: Product) => {
        const exists = wishlist.some(item => item.id === product.id);

        // Optimistic UI update
        if (exists) {
            setWishlist(prev => prev.filter(item => item.id !== product.id));
        } else {
            setWishlist(prev => [...prev, product]);
        }

        if (isAuthenticated && user?.email) {
            try {
                await axios.post(`${API_URL}/wishlist/toggle`, {
                    email: user.email,
                    productId: product.id
                });
            } catch (error) {
                console.error("Failed to toggle server wishlist", error);
                // Rollback if needed, but for wishlist optimistic is usually fine
            }
        }
    };

    const addToWishlist = (product: Product) => {
        if (!wishlist.some(item => item.id === product.id)) {
            toggleWishlist(product);
        }
    };

    const removeFromWishlist = (productId: string) => {
        const product = wishlist.find(item => item.id === productId);
        if (product) {
            toggleWishlist(product);
        }
    };

    const isInWishlist = (productId: string) => {
        return wishlist.some(item => item.id === productId);
    };

    const wishlistCount = wishlist.length;

    return (
        <WishlistContext.Provider value={{
            wishlist,
            addToWishlist,
            removeFromWishlist,
            toggleWishlist,
            isInWishlist,
            wishlistCount,
            loading
        }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
