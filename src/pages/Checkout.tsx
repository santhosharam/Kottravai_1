import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { CheckCircle, Lock, Truck, Store, ChevronDown, ShoppingBag } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { useCart } from '@/context/CartContext';
import { useOrders } from '@/context/OrderContext';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

import { useAuth } from '@/context/AuthContext';

const Checkout = () => {
    const { isAuthenticated, openLoginModal, user } = useAuth();
    const { cart, cartTotal, clearCart } = useCart();
    const { addOrder } = useOrders();

    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phone: user?.mobile || '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India',
        paymentMethod: 'online'
    });

    // Auto-prefill if user logs in while on page
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: prev.fullName || user.fullName || '',
                email: prev.email || user.email || '',
                phone: prev.phone || user.mobile || ''
            }));
        }
    }, [user]);

    const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [lastOrderDetails, setLastOrderDetails] = useState<any>(null);
    const [discountCode, setDiscountCode] = useState('');
    const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

    // Calculations
    const shippingCost = 50; // Example fixed shipping
    const discountAmount = 0; // Example placeholder
    const totalAmount = cartTotal + (deliveryMethod === 'delivery' ? shippingCost : 0) - discountAmount;

    // Help fix Mixed Content errors by ensuring local URLs are treated as relative paths
    const sanitizeUrl = (url: string) => {
        if (!url) return '';
        if (url.includes('localhost:')) {
            const parts = url.split('/');
            return '/' + parts.slice(3).join('/'); // Turns http://localhost:5000/img.png into /img.png
        }
        return url;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const RazorpayInstance = (window as any).Razorpay;
        if (!RazorpayInstance) {
            toast.error("Razorpay SDK not loaded. Please refresh the page.");
            setIsSubmitting(false);
            return;
        }

        try {
            // 1. Create Order on Backend
            const orderResponse = await fetch(`${API_URL}/razorpay/order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: totalAmount,
                    currency: "INR"
                })
            });

            if (!orderResponse.ok) {
                const err = await orderResponse.json();
                throw new Error(err.error || "Failed to create order");
            }

            const activeOrder = await orderResponse.json();

            // 2. Initialize Razorpay Options
            const options: any = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: activeOrder.amount,
                currency: activeOrder.currency,
                name: "Kottravai",
                description: "Transaction for Order #" + activeOrder.id,
                order_id: activeOrder.id,
                handler: async function (response: any) {
                    setIsSubmitting(true);
                    console.log("Payment completed by user", response);

                    // Store payment response for display if needed
                    const orderData = {
                        customerName: formData.fullName,
                        customerEmail: formData.email,
                        customerPhone: formData.phone,
                        address: formData.address,
                        city: formData.city,
                        pincode: formData.zipCode,
                        total: totalAmount,
                        items: cart.map(item => ({
                            ...item,
                            image: sanitizeUrl((item.selectedVariant?.images && item.selectedVariant.images.length > 0) ? item.selectedVariant.images[0] : item.image)
                        })),
                        paymentId: response.razorpay_payment_id,
                        orderId: response.razorpay_order_id
                    };
                    setLastOrderDetails(orderData);

                    try {
                        // 1. Show success screen IMMEDIATELY to user
                        setOrderPlaced(true);
                        clearCart();
                        window.scrollTo(0, 0);

                        // 2. Perform server-side verification and DB update in background
                        const verifyResponse = await fetch(`${API_URL}/razorpay/verify`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyResult = await verifyResponse.json();

                        if (verifyResult.status === "success") {
                            // 3. Save Order to Database
                            await addOrder(orderData);
                            console.log("Order saved to database successfully");
                        } else {
                            console.error("Payment verification failed on server", verifyResult);
                            // Even if verification failed, we have the payment ID
                        }
                    } catch (error: any) {
                        console.error("Post-payment process error:", error);
                    }
                    setIsSubmitting(false);
                },
                prefill: {
                    name: formData.fullName,
                    email: formData.email,
                    contact: formData.phone
                },
                theme: { color: "#8E2A8B" },
                modal: {
                    ondismiss: function () {
                        setIsSubmitting(false);
                    }
                }
            };

            const rzp = new RazorpayInstance(options);

            rzp.on('payment.failed', function (response: any) {
                console.error("Payment failure:", response.error);
                toast.error("Payment Failed: " + response.error.description);
                setIsSubmitting(false);
            });

            rzp.open();

        } catch (error: any) {
            console.error("Checkout submission error:", error);
            toast.error("Error: " + error.message);
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <MainLayout>
                <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 bg-gray-50 font-sans">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-[#b5128f]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Lock size={32} className="text-[#b5128f]" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#2D1B4E] mb-3">Login to Checkout</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            To ensure your order is saved to your account and for a secure shopping experience, please sign in.
                        </p>
                        <button
                            onClick={openLoginModal}
                            className="w-full bg-[#b5128f] text-white font-black uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-[#910e73] transition-all transform active:scale-95 shadow-xl shadow-[#b5128f]/20 flex items-center justify-center gap-2"
                        >
                            Sign In / Register
                        </button>
                        <Link to="/cart" className="inline-block mt-6 text-sm font-bold text-gray-400 hover:text-[#b5128f] transition-colors">
                            Return to Cart
                        </Link>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (cart.length === 0 && !orderPlaced) {
        return (
            <MainLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
                    <Link to="/shop" className="text-[#8E2A8B] font-medium hover:underline">
                        Return to Shop
                    </Link>
                </div>
            </MainLayout>
        );
    }

    if (orderPlaced) {
        return (
            <MainLayout>
                <div className="min-h-[80vh] py-16 bg-gray-50">
                    <div className="container mx-auto px-4 max-w-2xl">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden text-center p-8 md:p-12">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6 animate-bounce">
                                <CheckCircle size={40} />
                            </div>
                            <h1 className="text-3xl font-black text-[#2D1B4E] mb-4">Payment Successful!</h1>
                            <p className="text-gray-600 mb-8">
                                Thank you for your purchase. Your order has been placed successfully and is being processed.
                            </p>

                            {lastOrderDetails && (
                                <div className="bg-purple-50 rounded-xl p-6 text-left mb-8 border border-purple-100">
                                    <h3 className="font-bold text-[#2D1B4E] mb-4 border-b border-purple-200 pb-2 text-center">Order Confirmation Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">Customer Name</p>
                                            <p className="font-semibold text-gray-800">{lastOrderDetails.customerName}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Email</p>
                                            <p className="font-semibold text-gray-800">{lastOrderDetails.customerEmail}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Transaction ID</p>
                                            <p className="font-semibold text-purple-700 break-all">{lastOrderDetails.paymentId || 'Processing...'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Amount Paid</p>
                                            <p className="font-bold text-[#8E2A8B] text-lg">₹{lastOrderDetails.total}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-purple-200">
                                        <p className="text-gray-500 mb-2">Items Purchased:</p>
                                        <div className="space-y-2">
                                            {lastOrderDetails.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-purple-100">
                                                    <div className="flex items-center gap-3">
                                                        <img src={sanitizeUrl(item.image)} alt="" className="w-10 h-10 object-cover rounded" />
                                                        <div>
                                                            <span className="text-gray-700 font-medium block">{item.name}</span>
                                                            {item.selectedVariant && (
                                                                <span className="text-[10px] text-[#8E2A8B] font-bold">{item.selectedVariant.weight}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-purple-600 font-bold">x{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-purple-200">
                                        <p className="text-gray-500">Shipping Address:</p>
                                        <p className="font-semibold text-gray-800">{lastOrderDetails.address}, {lastOrderDetails.city} - {lastOrderDetails.pincode}</p>
                                    </div>
                                </div>
                            )}

                            <Link to="/shop" className="inline-block bg-[#8E2A8B] text-white px-10 py-4 rounded-xl font-bold hover:bg-[#701a6d] transition-all shadow-lg hover:transform hover:scale-105">
                                Return to Shop
                            </Link>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }


    return (

        <MainLayout>
            <Helmet>
                <title>Checkout - Kottravai</title>
            </Helmet>

            <div className="bg-gray-50 min-h-screen py-6 md:py-10 font-sans">
                <div className="container mx-auto px-4 max-w-6xl">
                    <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-6 md:mb-8">Checkout</h1>

                    {/* Mobile Order Summary Toggle */}
                    <div className="lg:hidden mb-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50/50"
                        >
                            <div className="flex items-center gap-2 text-[#8E2A8B] font-bold text-sm uppercase tracking-wider">
                                <ShoppingBag size={18} />
                                <span>{isMobileSummaryOpen ? 'Hide' : 'Show'} Order Summary</span>
                                <ChevronDown size={16} className={`transition-transform duration-200 ${isMobileSummaryOpen ? 'rotate-180' : ''}`} />
                            </div>
                            <span className="font-bold text-lg text-[#1A1A1A]">₹{totalAmount}</span>
                        </button>

                        {isMobileSummaryOpen && (
                            <div className="p-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-4 mb-4">
                                    {cart.map((item) => (
                                        <div key={`${item.id}-${item.selectedVariant?.weight || 'default'}`} className="flex gap-3 items-center">
                                            <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 relative">
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center z-10">{item.quantity}</span>
                                                <img src={(item.selectedVariant?.images && item.selectedVariant?.images.length > 0) ? item.selectedVariant.images[0] : item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                                                {item.selectedVariant && (
                                                    <div className="text-[9px] text-[#8E2A8B] font-bold uppercase">{item.selectedVariant.weight}</div>
                                                )}
                                            </div>
                                            <div className="font-bold text-gray-900 text-sm">
                                                ₹{item.price * item.quantity}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2 border-t border-gray-100 pt-3 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>₹{cartTotal}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span>{deliveryMethod === 'delivery' ? `₹${shippingCost}` : 'Free'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* LEFT COLUMN: Shipping Info */}
                        <div className="lg:w-7/12 w-full">
                            <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">Shipping Information</h2>

                            {/* Delivery/Pickup Toggle */}
                            <div className="flex gap-4 mb-8">
                                <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryMethod === 'delivery' ? 'border-[#8E2A8B] bg-purple-50 text-[#8E2A8B]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                                    <input
                                        type="radio"
                                        name="deliveryMethod"
                                        className="hidden"
                                        checked={deliveryMethod === 'delivery'}
                                        onChange={() => setDeliveryMethod('delivery')}
                                    />
                                    <Truck size={20} />
                                    <span className="font-medium">Delivery</span>
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryMethod === 'pickup' ? 'border-[#8E2A8B] bg-purple-50 text-[#8E2A8B]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                                    <input
                                        type="radio"
                                        name="deliveryMethod"
                                        className="hidden"
                                        checked={deliveryMethod === 'pickup'}
                                        onChange={() => setDeliveryMethod('pickup')}
                                    />
                                    <Store size={20} />
                                    <span className="font-medium">Pick up</span>
                                </label>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                        placeholder="Enter full name"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email address <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                        placeholder="Enter email address"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone number <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <div className="absolute left-0 top-0 h-full px-3 flex items-center border-r border-gray-200 text-gray-500 bg-gray-50 rounded-l-lg">
                                            <span className="text-lg mr-1">🇮🇳</span>
                                            <ChevronDown size={14} />
                                        </div>
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            className="w-full pl-24 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                            placeholder="Enter phone number"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            name="country"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all appearance-none bg-white font-medium text-gray-700"
                                            value={formData.country}
                                            onChange={handleChange}
                                        >
                                            <option value="India">India</option>
                                            <option value="USA">United States</option>
                                            <option value="UK">United Kingdom</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            required
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                            placeholder="Enter city"
                                            value={formData.city}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                                        <input
                                            type="text"
                                            name="state"
                                            required
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                            placeholder="Enter state"
                                            value={formData.state}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
                                        <input
                                            type="text"
                                            name="zipCode"
                                            required
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                            placeholder="Enter ZIP code"
                                            value={formData.zipCode}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                        placeholder="123 Street Name, Area"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="flex items-start gap-3 mt-6">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        required
                                        className="mt-1 w-5 h-5 rounded border-gray-300 text-[#8E2A8B] focus:ring-[#8E2A8B]"
                                    />
                                    <label htmlFor="terms" className="text-sm text-gray-600">
                                        I have read and agree to the <Link to="/terms" className="text-[#8E2A8B] hover:underline">Terms and Conditions</Link>.
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Order Summary */}
                        <div className="lg:w-5/12 w-full lg:pl-8">
                            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                                <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">Review your cart</h2>

                                <div className="space-y-6 mb-8 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {cart.map((item) => (
                                        <div key={`${item.id}-${item.selectedVariant?.weight || 'default'}`} className="flex gap-4 items-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                                <img src={(item.selectedVariant?.images && item.selectedVariant.images.length > 0) ? item.selectedVariant.images[0] : item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 leading-tight">{item.name}</h4>
                                                {item.selectedVariant && (
                                                    <div className="text-[10px] font-bold text-[#8E2A8B] uppercase tracking-wider mt-0.5">{item.selectedVariant.weight}</div>
                                                )}
                                                <div className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</div>
                                            </div>
                                            <div className="font-bold text-gray-900">
                                                ₹{item.price * item.quantity}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Discount Code */}
                                <div className="flex gap-2 mb-8">
                                    <input
                                        type="text"
                                        placeholder="Discount code"
                                        className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8E2A8B] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                        value={discountCode}
                                        onChange={(e) => setDiscountCode(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="px-6 py-3 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>

                                {/* Totals */}
                                <div className="space-y-4 border-t border-gray-100 pt-6 mb-8">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium">₹{cartTotal}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span className="font-medium">{deliveryMethod === 'delivery' ? `₹${shippingCost}` : 'Free'}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Discount</span>
                                        <span className="font-medium text-green-600">-₹{discountAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold text-[#1A1A1A] pt-4 border-t border-gray-100">
                                        <span>Total</span>
                                        <span>₹{totalAmount}</span>
                                    </div>
                                </div>

                                {/* Pay Now Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-[#3B82F6] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#2563EB] transition-all transform active:scale-[0.98] shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed mb-6"
                                >
                                    {isSubmitting ? 'Processing...' : 'Pay Now'}
                                </button>

                                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                                    <Lock size={16} />
                                    <span>Secure Checkout - SSL Encrypted</span>
                                </div>
                                <p className="text-xs text-center text-gray-400 mt-2">
                                    Ensuring your financial and personal details are secure during every transaction.
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
};

export default Checkout;
