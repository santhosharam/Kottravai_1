import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/utils/supabaseClient';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface User {
    id: string;
    username: string; // This is the email or username used for session identification
    mobile: string;
    fullName: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isLoginModalOpen: boolean;
    openLoginModal: () => void;
    closeLoginModal: () => void;
    login: (username: string, password: string) => Promise<{ error: any }>;
    signUp: (username: string, password: string, mobile: string, fullName: string) => Promise<{ error: any }>;
    sendOTP: (mobile: string) => Promise<{ error: any }>;
    verifyOTP: (mobile: string, otp: string) => Promise<{ error: any }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = () => setIsLoginModalOpen(false);

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const u = session.user;
                const isVirtual = u.email?.endsWith('@mobile.internal');
                setUser({
                    id: u.id,
                    username: u.user_metadata?.username || u.email?.split('@')[0] || u.phone || '',
                    mobile: u.user_metadata?.mobile || u.phone?.replace(/^\+91/, '') || (isVirtual ? u.email?.split('@')[0] || '' : ''),
                    fullName: u.user_metadata?.full_name || ''
                });
            }
            setIsLoading(false);
        };

        fetchSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const u = session.user;
                const isVirtual = u.email?.endsWith('@mobile.internal');
                setUser({
                    id: u.id,
                    username: u.user_metadata?.username || u.email?.split('@')[0] || u.phone || '',
                    mobile: u.user_metadata?.mobile || u.phone?.replace(/^\+91/, '') || (isVirtual ? u.email?.split('@')[0] || '' : ''),
                    fullName: u.user_metadata?.full_name || ''
                });
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const login = async (identifier: string, password: string) => {
        try {
            // Check if identifier looks like a phone number (10 digits)
            const isPhone = /^\d{10}$/.test(identifier) || /^\+91\d{10}$/.test(identifier);

            let credentials: any = { password };
            if (isPhone) {
                const formattedPhone = identifier.startsWith('+') ? identifier : `+91${identifier}`;
                // Match the virtual email pattern from the server
                credentials.email = `${formattedPhone.replace('+', '')}@mobile.internal`;
            } else {
                // Fallback for username-based mapping (used if user was registered via username)
                credentials.email = `${identifier.toLowerCase()}@user.internal`;
            }

            const { error } = await supabase.auth.signInWithPassword(credentials);

            if (error) throw error;
            closeLoginModal();
            return { error: null };
        } catch (error: any) {
            console.error('Login error:', error);
            return { error };
        }
    };


    const signUp = async (username: string, password: string, mobile: string, fullName: string) => {
        try {
            // Call backend instead of directly calling supabase.auth.signUp to bypass email limits
            await axios.post(`${API_BASE}/auth/register`, {
                username,
                password,
                mobile,
                fullName
            });

            // Automatically log in after successful signup using the mobile number
            const { error: loginError } = await login(mobile, password);
            if (loginError) throw loginError;

            return { error: null };
        } catch (error: any) {
            console.error('Signup error:', error);
            return { error: error.response?.data?.error || error.message || 'Signup failed' };
        }
    };

    const sendOTP = async (mobile: string) => {
        try {
            const response = await axios.post(`${API_BASE}/auth/send-otp`, { mobile });
            return { error: null, data: response.data };
        } catch (error: any) {
            console.error('Send OTP error:', error);
            return { error: error.response?.data || { message: 'Failed to send OTP' } };
        }
    };

    const verifyOTP = async (mobile: string, otp: string) => {
        try {
            const response = await axios.post(`${API_BASE}/auth/verify-otp`, { mobile, otp });
            return { error: null, data: response.data };
        } catch (error: any) {
            console.error('Verify OTP error:', error);
            return { error: error.response?.data || { message: 'Invalid OTP' } };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            isLoginModalOpen,
            openLoginModal,
            closeLoginModal,
            login,
            signUp,
            sendOTP,
            verifyOTP,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
