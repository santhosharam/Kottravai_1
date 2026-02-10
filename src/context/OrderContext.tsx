import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from './CartContext';
import { useAuth } from './AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface Order {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    address?: string;
    city?: string;
    pincode?: string;
    items: CartItem[];
    total: number;
    status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    date: string;
    paymentId?: string;
    orderId?: string;
}

interface OrderContextType {
    orders: Order[];
    adminOrders: Order[];
    addOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => Promise<void>;
    updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
    deleteOrder: (id: string) => Promise<void>;
    refreshOrders: () => Promise<void>;
    fetchAllOrders: () => Promise<void>;
    loading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
    const { user, isAuthenticated } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [adminOrders, setAdminOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchOrders = async () => {
        if (!user?.email) return;
        try {
            const response = await axios.get(`${API_URL}/orders?email=${user.email}`);
            setOrders(response.data);
        } catch (error) {
            console.error("Failed to fetch user orders", error);
        }
    };

    const fetchAllOrders = async () => {
        try {
            const response = await axios.get(`${API_URL}/orders`);
            setAdminOrders(response.data);
        } catch (error) {
            console.error("Failed to fetch all orders for admin", error);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user?.email) {
            setLoading(true);

            // Only fetch what's needed for the current user
            fetchOrders().finally(() => setLoading(false));

            // Polling for live updates only if authenticated
            const interval = setInterval(() => {
                fetchOrders();
            }, 60000); // Increased interval to 1 minute
            return () => clearInterval(interval);
        } else {
            setOrders([]);
            setAdminOrders([]);
        }
    }, [isAuthenticated, user?.email]);

    const addOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
        try {
            const response = await axios.post(`${API_URL}/orders`, orderData);
            setOrders(prev => [response.data, ...prev]);
            fetchAllOrders(); // Sync admin view
        } catch (error) {
            console.error("Failed to add order", error);
            throw error;
        }
    };

    const updateOrderStatus = async (id: string, status: Order['status']) => {
        try {
            await axios.put(`${API_URL}/orders/${id}`, { status });
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
            setAdminOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        } catch (error) {
            console.error("Failed to update order status", error);
            throw error;
        }
    };

    const deleteOrder = async (id: string) => {
        try {
            await axios.delete(`${API_URL}/orders/${id}`);
            setOrders(prev => prev.filter(o => o.id !== id));
            setAdminOrders(prev => prev.filter(o => o.id !== id));
        } catch (error) {
            console.error("Failed to delete order", error);
            throw error;
        }
    };

    return (
        <OrderContext.Provider value={{
            orders,
            adminOrders,
            addOrder,
            updateOrderStatus,
            deleteOrder,
            refreshOrders: fetchOrders,
            fetchAllOrders,
            loading
        }}>
            {children}
        </OrderContext.Provider>
    );
};

export const useOrders = () => {
    const context = useContext(OrderContext);
    if (!context) {
        throw new Error('useOrders must be used within a OrderProvider');
    }
    return context;
};

