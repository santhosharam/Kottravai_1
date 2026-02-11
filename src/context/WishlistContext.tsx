import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product } from '@/data/products';
import { useAuth } from './AuthContext';
import { supabase } from '@/utils/supabaseClient';
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
        if (!user?.username) return;
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const response = await axios.get(`${API_URL}/wishlist`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWishlist(response.data);
        } catch (error) {
            console.error("Failed to fetch wishlist", error);
        } finally {
            setLoading(false);
        }
    }, [user?.username]);

    // Handle initial load and sync
    useEffect(() => {
        if (isAuthenticated && user?.username) {
            // Check for guest wishlist to merge
            const guestWishlistStr = localStorage.getItem('kottravai_wishlist');
            if (guestWishlistStr) {
                try {
                    const guestItems = JSON.parse(guestWishlistStr);
                    if (Array.isArray(guestItems) && guestItems.length > 0) {
                        // Merge guest items into server wishlist in the background
                        const mergeAll = async () => {
                            const { data: { session } } = await supabase.auth.getSession();
                            const token = session?.access_token;

                            for (const product of guestItems) {
                                // Add to local state first for instant feedback if not already there
                                setWishlist(prev => {
                                    if (prev.some(item => item.id === product.id)) return prev;
                                    return [...prev, product];
                                });

                                // Sync to server
                                try {
                                    await axios.post(`${API_URL}/wishlist/toggle`, {
                                        productId: product.id
                                    }, {
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                } catch (e) {
                                    console.error("Failed to sync guest item", product.id, e);
                                }
                            }
                            localStorage.removeItem('kottravai_wishlist');
                        };
                        mergeAll();
                    } else {
                        localStorage.removeItem('kottravai_wishlist');
                    }
                } catch (e) {
                    console.error("Failed to merge guest wishlist", e);
                }
            }
            fetchWishlist();
        } else if (!isAuthenticated) {
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
    }, [isAuthenticated, user?.username, fetchWishlist]);

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

        if (isAuthenticated && user?.username) {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                await axios.post(`${API_URL}/wishlist/toggle`, {
                    productId: product.id
                }, {
                    headers: { Authorization: `Bearer ${token}` }
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
