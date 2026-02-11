import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { useCart } from '@/context/CartContext';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

    return (
        <MainLayout>
            <Helmet>
                <title>Shopping Cart - Kottravai</title>
            </Helmet>

            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-[#2D1B4E] mb-8 text-center md:text-left">Your Cart ({cartCount})</h1>

                {cart.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-100">
                        <ShoppingBag size={64} className="mx-auto text-gray-300 mb-6" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
                        <Link to="/shop" className="inline-block bg-[#8E2A8B] text-white px-8 py-3 rounded-full font-bold hover:bg-[#701a6d] transition-colors">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Cart Items */}
                        <div className="lg:w-2/3 space-y-4">
                            {cart.map((item) => (
                                <div key={`${item.id}-${item.selectedVariant?.weight || 'default'}`} className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="w-full sm:w-24 h-24 bg-gray-50 rounded-md overflow-hidden flex-shrink-0">
                                        <img src={(item.selectedVariant?.images && item.selectedVariant.images.length > 0) ? item.selectedVariant.images[0] : item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>

                                    <div className="flex-1 text-center sm:text-left">
                                        <h3 className="font-bold text-[#1A1A1A]">{item.name}</h3>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-500">{item.category}</span>
                                            {item.selectedVariant && (
                                                <span className="text-[10px] font-bold bg-purple-50 text-[#8E2A8B] px-2 py-0.5 rounded uppercase tracking-wider border border-purple-100">
                                                    {item.selectedVariant.weight}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[#8E2A8B] font-bold mt-1">₹{item.price}</div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedVariant?.weight)}
                                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariant?.weight)}
                                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <div className="text-right min-w-[80px] font-bold text-gray-800 hidden sm:block">
                                        ₹{item.price * item.quantity}
                                    </div>

                                    <button
                                        onClick={() => removeFromCart(item.id, item.selectedVariant?.weight)}
                                        className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                                        title="Remove item"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:w-1/3">
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 sticky top-24">
                                <h3 className="text-xl font-bold text-[#2D1B4E] mb-6">Order Summary</h3>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>₹{cartTotal}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span className="text-green-600 font-medium">Free</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-lg text-[#1A1A1A]">
                                        <span>Total</span>
                                        <span>₹{cartTotal}</span>
                                    </div>
                                </div>

                                <Link to="/checkout" className="w-full bg-[#8E2A8B] text-white py-4 rounded-xl font-bold hover:bg-[#701a6d] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-purple-900/10">
                                    Proceed to Checkout <ArrowRight size={18} />
                                </Link>

                                <p className="text-xs text-center text-gray-400 mt-4">
                                    Secure checkout powered by Razorpay
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Cart;
