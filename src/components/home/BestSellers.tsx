import { useState } from 'react';
import { useProducts } from '@/context/ProductContext';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Eye, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const BestSellers = () => {
    const { products } = useProducts();
    const { addToCart, cart, removeFromCart } = useCart();

    // State for active tab filtering
    const [activeTab, setActiveTab] = useState('All Products');

    // Filter logic
    const getFilteredProducts = () => {
        // 1. Filter checks if it's marked as Best Seller
        let filtered = products.filter(p => p.isBestSeller);

        // 2. Filter by Category Tab
        if (activeTab === 'Coco Crafts') {
            filtered = filtered.filter(p => p.category === 'Coco Crafts');
        } else if (activeTab === 'Terracotta') {
            filtered = filtered.filter(p => p.category === 'Terracotta Ornaments');
        } else if (activeTab === 'Essential Care') {
            filtered = filtered.filter(p => p.category === 'Essential Care');
        }

        // Return max 4 items as requested
        return filtered.slice(0, 4);
    };

    const displayProducts = getFilteredProducts();

    if (!products || products.length === 0) {
        return null;
    }

    // Helper to style buttons
    const getTabClass = (tabName: string) => {
        return activeTab === tabName
            ? "text-primary border-b-2 border-primary pb-2 whitespace-nowrap font-bold"
            : "hover:text-primary pb-2 whitespace-nowrap transition-colors";
    };

    return (
        <section className="py-10 bg-white">
            <div className="container px-4">
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Best Sellers</h2>
                    <div className="w-24 h-1 bg-primary mx-auto"></div>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center mb-6 px-4 overflow-x-auto no-scrollbar">
                    <div className="flex space-x-4 md:space-x-8 text-sm md:text-base font-medium text-gray-500 min-w-max pb-2">
                        <button
                            onClick={() => setActiveTab('All Products')}
                            className={getTabClass('All Products')}
                        >
                            All Products
                        </button>
                        <button
                            onClick={() => setActiveTab('Coco Crafts')}
                            className={getTabClass('Coco Crafts')}
                        >
                            Coco Crafts
                        </button>
                        <button
                            onClick={() => setActiveTab('Terracotta')}
                            className={getTabClass('Terracotta')}
                        >
                            Terracotta
                        </button>
                        <button
                            onClick={() => setActiveTab('Essential Care')}
                            className={getTabClass('Essential Care')}
                        >
                            Essential Care
                        </button>
                    </div>
                </div>

                {/* Product Grid */}
                {displayProducts.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {displayProducts.map((product) => {
                            const isInCart = cart.some(item => item.id === product.id);
                            return (
                                <div key={product.id} className="group relative bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">

                                    {/* Product Image */}
                                    <div className="relative h-48 sm:h-64 overflow-hidden bg-gray-100">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />

                                        {/* Overlay Action Buttons */}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2 md:space-x-4">
                                            {/* Mobile Visibility Fix: Always show buttons on mobile */}
                                            <div className="flex md:contents space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                                                {product.isCustomRequest ? (
                                                    <Link to={`/product/${product.slug}`} className="p-2 md:p-3 bg-white text-[#8E2A8B] rounded-full hover:bg-[#8E2A8B] hover:text-white transition-colors shadow-lg">
                                                        <Eye size={18} className="md:w-5 md:h-5" />
                                                    </Link>
                                                ) : (
                                                    <>
                                                        {product.variants && product.variants.length > 0 ? (
                                                            <Link to={`/product/${product.slug}`} className="p-2 md:p-3 bg-white text-gray-900 rounded-full hover:bg-[#8E2A8B] hover:text-white transition-colors shadow-lg">
                                                                <Eye size={18} className="md:w-5 md:h-5" />
                                                            </Link>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    isInCart ? removeFromCart(product.id) : addToCart(product);
                                                                }}
                                                                className={`p-2 md:p-3 rounded-full shadow-lg transition-colors ${isInCart
                                                                    ? 'bg-[#8E2A8B] text-white hover:bg-[#701a6d]'
                                                                    : 'bg-white text-gray-900 hover:bg-[#8E2A8B] hover:text-white'
                                                                    }`}
                                                                title={isInCart ? "Remove from Cart" : "Add to Cart"}
                                                            >
                                                                {isInCart ? <Check size={18} className="md:w-5 md:h-5" /> : <ShoppingCart size={18} className="md:w-5 md:h-5" />}
                                                            </button>
                                                        )}
                                                        {!(product.variants && product.variants.length > 0) && (
                                                            <Link to={`/product/${product.slug}`} className="p-2 md:p-3 bg-white text-gray-900 rounded-full hover:bg-[#8E2A8B] hover:text-white transition-colors shadow-lg">
                                                                <Eye size={18} className="md:w-5 md:h-5" />
                                                            </Link>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Badge */}
                                        <span className="absolute top-2 left-2 md:top-3 md:left-3 bg-red-500 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                                            SALE
                                        </span>
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-3 md:p-5 text-center">
                                        <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                                            {product.category}
                                        </span>
                                        <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2 group-hover:text-primary transition-colors cursor-pointer truncate">
                                            <Link to={`/product/${product.slug}`}>{product.name}</Link>
                                        </h3>
                                        <div className="text-secondary font-bold text-sm md:text-lg">
                                            {product.isCustomRequest ? (
                                                <span className="text-[10px] md:text-sm italic bg-purple-50 px-2 py-0.5 md:py-1 rounded">Price on Request</span>
                                            ) : product.variants && product.variants.length > 0 ? (
                                                <span className="flex flex-col items-center">
                                                    <span className="text-[8px] md:text-[10px] uppercase tracking-tighter opacity-70">Starting From</span>
                                                    <span>₹{Math.min(...product.variants.map(v => v.price)).toLocaleString('en-IN')}</span>
                                                </span>
                                            ) : (
                                                <>₹{parseFloat(product.price.toString()).toLocaleString('en-IN')}</>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        No products found in this category.
                    </div>
                )}

                <div className="text-center mt-12">
                    <a href="/shop" className="inline-block border-2 border-gray-900 text-gray-900 px-8 py-3 font-semibold rounded hover:bg-gray-900 hover:text-white transition-colors">
                        View All Products
                    </a>
                </div>
            </div>
        </section>
    );
};

export default BestSellers;