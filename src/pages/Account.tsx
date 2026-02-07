import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/layouts/MainLayout';
import { User, Package, Heart, LogOut, ArrowRight, ShieldCheck, ShoppingBag, CreditCard, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useOrders } from '@/context/OrderContext';

const Account = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, logout, openLoginModal } = useAuth();
    const { wishlist, toggleWishlist } = useWishlist();
    const { orders, loading: ordersLoading } = useOrders();
    const [activeTab, setActiveTab] = useState('dashboard');

    // User Profile State
    const [userProfile, setUserProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: ''
    });

    if (!isAuthenticated) {
        return (
            <MainLayout>
                <Helmet><title>Account - Kottravai</title></Helmet>
                <div className="bg-[#FAF9F6] py-32 min-h-[60vh] flex items-center justify-center">
                    <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-gray-100 max-w-lg w-full text-center">
                        <div className="w-20 h-20 bg-[#b5128f]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <User size={40} className="text-[#b5128f]" />
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-[#2D1B4E] mb-4">Your profile awaits</h1>
                        <p className="text-gray-500 mb-10 leading-relaxed">
                            Please sign in to view your orders, track your wishlist, and update your profile details.
                        </p>

                        <button
                            onClick={openLoginModal}
                            className="w-full bg-[#b5128f] text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl hover:bg-[#910e73] transition-all transform active:scale-95 shadow-xl shadow-[#b5128f]/20 flex items-center justify-center gap-3"
                        >
                            Sign In Now <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-serif font-bold text-[#2D1B4E]">Welcome back, {user?.name}!</h2>
                                <p className="text-gray-500 mt-1">Manage your account and view recent activity.</p>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-3 bg-blue-50 w-max rounded-2xl mb-4 text-blue-600">
                                    <ShoppingBag size={24} />
                                </div>
                                <h3 className="text-gray-900 font-bold text-lg">My Orders</h3>
                                <p className="text-gray-500 text-sm mb-4">View and track your purchases.</p>
                                <button onClick={() => setActiveTab('orders')} className="text-[#b5128f] font-bold text-sm flex items-center gap-2 hover:translate-x-1 transition-transform">
                                    Track Orders <ArrowRight size={16} />
                                </button>
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-3 bg-red-50 w-max rounded-2xl mb-4 text-red-600">
                                    <Heart size={24} />
                                </div>
                                <h3 className="text-gray-900 font-bold text-lg">My Wishlist</h3>
                                <p className="text-gray-500 text-sm mb-4">Items you've saved for later.</p>
                                <button onClick={() => setActiveTab('wishlist')} className="text-[#b5128f] font-bold text-sm flex items-center gap-2 hover:translate-x-1 transition-transform">
                                    View Items <ArrowRight size={16} />
                                </button>
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-3 bg-green-50 w-max rounded-2xl mb-4 text-green-600">
                                    <ShieldCheck size={24} />
                                </div>
                                <h3 className="text-gray-900 font-bold text-lg">Security</h3>
                                <p className="text-gray-500 text-sm mb-4">Your account is fully protected.</p>
                                <button onClick={() => setActiveTab('profile')} className="text-[#b5128f] font-bold text-sm flex items-center gap-2 hover:translate-x-1 transition-transform">
                                    Update Password <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>

                    </div>
                );
            case 'orders':
                return (
                    <div className="animate-in fade-in duration-500">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-[#2D1B4E]">Order History</h2>
                            <p className="text-gray-500">A detailed list of all your previous orders.</p>
                        </div>

                        {ordersLoading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b5128f]"></div>
                            </div>
                        ) : orders.length > 0 ? (
                            <div className="space-y-6">
                                {orders.map((order: any) => (
                                    <div key={order.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all p-6 md:p-8">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-50">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Order ID:</span>
                                                    <span className="text-sm font-bold text-[#2D1B4E]">#{order.orderId || order.id.slice(0, 8)}</span>
                                                </div>
                                                <p className="text-xs text-gray-400">{new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                                <div className="text-right">
                                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400 block mb-1">Total Amount</span>
                                                    <span className="text-xl font-black text-[#b5128f]">₹{parseFloat(order.total.toString()).toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${order.status === 'Delivered' ? 'bg-green-50 text-green-600' :
                                                    order.status === 'Processing' ? 'bg-blue-50 text-blue-600' :
                                                        order.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                                                            'bg-yellow-50 text-yellow-600'
                                                    }`}>
                                                    {order.status}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {order.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate(`/product/${item.slug}`)}>
                                                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-[#2D1B4E] truncate group-hover:text-[#b5128f] transition-colors">{item.name}</h4>
                                                        <p className="text-xs text-gray-400">Quantity: {item.quantity} × ₹{item.price}</p>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-[#b5128f] transition-colors" />
                                                </div>
                                            ))}
                                        </div>

                                        {order.paymentId && (
                                            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                <CreditCard size={14} />
                                                <span>Payment ID: {order.paymentId}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                                <Package className="mx-auto text-gray-300 mb-4" size={60} />
                                <p className="text-gray-500 font-medium text-lg">You haven't placed any orders yet.</p>
                                <button
                                    onClick={() => navigate('/shop')}
                                    className="mt-6 bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-[#b5128f] transition-colors shadow-lg shadow-black/10"
                                >
                                    Start Shopping
                                </button>
                            </div>
                        )}
                    </div>
                );
            case 'profile':
                return (
                    <div className="animate-in fade-in duration-500">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-[#2D1B4E]">Security & Profile</h2>
                            <p className="text-gray-500">Update your personal information and login credentials.</p>
                        </div>
                        <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                            <div className="grid gap-8 max-w-xl">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={userProfile.name}
                                        onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                                        className="w-full bg-white border-none rounded-2xl px-6 py-4 shadow-sm focus:ring-2 focus:ring-[#b5128f]/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={userProfile.email}
                                        onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                                        className="w-full bg-white border-none rounded-2xl px-6 py-4 shadow-sm focus:ring-2 focus:ring-[#b5128f]/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={userProfile.phone}
                                        onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                                        placeholder="Add your mobile number"
                                        className="w-full bg-white border-none rounded-2xl px-6 py-4 shadow-sm focus:ring-2 focus:ring-[#b5128f]/20 outline-none transition-all"
                                    />
                                </div>
                                <button className="w-full sm:w-max bg-[#b5128f] text-white font-black uppercase tracking-[0.2em] py-4 px-10 rounded-2xl hover:bg-[#910e73] transition-all transform active:scale-95 shadow-xl shadow-[#b5128f]/20">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'wishlist':
                return (
                    <div className="animate-in fade-in duration-500">
                        <div className="mb-8 flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-bold text-[#2D1B4E]">My Wishlist</h2>
                                <p className="text-gray-500">All the organic goodness you've saved for later.</p>
                            </div>
                            {wishlist.length > 0 && (
                                <p className="text-sm font-bold text-[#b5128f]">
                                    {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'} Saved
                                </p>
                            )}
                        </div>

                        {wishlist.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {wishlist.map((product: any) => (
                                    <div key={product.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                                        <div className="relative h-48">
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <button
                                                onClick={() => toggleWishlist(product)}
                                                className="absolute top-4 right-4 w-9 h-9 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <Heart size={18} fill="currentColor" />
                                            </button>
                                        </div>
                                        <div className="p-6">
                                            <h4 className="font-bold text-[#2D1B4E] mb-1 truncate">{product.name}</h4>
                                            <div className="flex justify-between items-center mt-4">
                                                <span className="font-black text-[#b5128f]">₹{parseFloat(product.price.toString()).toLocaleString('en-IN')}</span>
                                                <button
                                                    onClick={() => navigate(`/product/${product.slug}`)}
                                                    className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-[#b5128f] transition-colors"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                                <Heart className="mx-auto text-gray-300 mb-4" size={60} />
                                <p className="text-gray-500 font-medium text-lg">Your wishlist is currently empty.</p>
                                <button
                                    onClick={() => navigate('/shop')}
                                    className="mt-6 text-[#b5128f] font-bold hover:underline"
                                >
                                    Browse Products
                                </button>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <MainLayout>
            <Helmet>
                <title>My Account - Kottravai</title>
            </Helmet>

            <div className="bg-[#FAF9F6] pt-8 pb-16 md:pt-10 md:pb-24">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* Modern Sidebar */}
                        <div className="lg:w-1/4 space-y-4">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 bg-[#b5128f] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-[#b5128f]/20">
                                        {user?.name?.[0].toUpperCase() || 'K'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#2D1B4E]">{user?.name}</h4>
                                        <p className="text-xs text-gray-500 font-medium">{userProfile.email}</p>
                                    </div>
                                </div>

                                <nav className="space-y-2">
                                    {[
                                        { id: 'dashboard', label: 'Dashboard', icon: ShieldCheck },
                                        { id: 'profile', label: 'Profile Settings', icon: User },
                                        { id: 'orders', label: 'Order History', icon: Package },
                                        { id: 'wishlist', label: 'Wishlist', icon: Heart }
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === item.id
                                                ? 'bg-[#b5128f] text-white shadow-xl shadow-[#b5128f]/20 translate-x-1'
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-[#b5128f]'
                                                }`}
                                        >
                                            <item.icon size={20} />
                                            {item.label}
                                        </button>
                                    ))}
                                </nav>

                                <div className="mt-12 pt-8 border-t border-gray-100">
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
                                    >
                                        <LogOut size={20} /> Logout Account
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="lg:w-3/4 min-h-[600px]">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Account;
