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
        <section className="py-20 bg-white">
            <div className="container px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-serif">Best Sellers</h2>
                    <div className="w-24 h-1 bg-primary mx-auto"></div>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center space-x-8 mb-12 text-sm md:text-base font-medium text-gray-500 overflow-x-auto">
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

                {/* Product Grid */}
                {displayProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {displayProducts.map((product) => {
                            const isInCart = cart.some(item => item.id === product.id);
                            return (
                                <div key={product.id} className="group relative bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">

                                    {/* Product Image */}
                                    <div className="relative h-64 overflow-hidden bg-gray-100">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />

                                        {/* Overlay Action Buttons */}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
                                            {product.isCustomRequest ? (
                                                <Link to={`/product/${product.slug}`} className="p-3 bg-white text-[#8E2A8B] rounded-full hover:bg-[#8E2A8B] hover:text-white transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300">
                                                    <Eye size={20} />
                                                </Link>
                                            ) : (
                                                <>
                                                    {product.variants && product.variants.length > 0 ? (
                                                        <Link to={`/product/${product.slug}`} className="p-3 bg-white text-gray-900 rounded-full hover:bg-[#8E2A8B] hover:text-white transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300">
                                                            <div className="flex flex-col items-center">
                                                                <Eye size={20} />
                                                            </div>
                                                        </Link>
                                                    ) : (
                                                        <button
                                                            onClick={() => isInCart ? removeFromCart(product.id) : addToCart(product)}
                                                            className={`p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 transition-colors ${isInCart
                                                                ? 'bg-[#8E2A8B] text-white hover:bg-[#701a6d]'
                                                                : 'bg-white text-gray-900 hover:bg-[#8E2A8B] hover:text-white'
                                                                }`}
                                                            title={isInCart ? "Remove from Cart" : "Add to Cart"}
                                                        >
                                                            {isInCart ? <Check size={20} /> : <ShoppingCart size={20} />}
                                                        </button>
                                                    )}
                                                    {!(product.variants && product.variants.length > 0) && (
                                                        <Link to={`/product/${product.slug}`} className="p-3 bg-white text-gray-900 rounded-full hover:bg-[#8E2A8B] hover:text-white transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75">
                                                            <Eye size={20} />
                                                        </Link>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Badge */}
                                        <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                            SALE
                                        </span>
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-5 text-center">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                                            {product.category}
                                        </span>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors cursor-pointer">
                                            <Link to={`/product/${product.slug}`}>{product.name}</Link>
                                        </h3>
                                        <p className="text-primary font-bold text-lg">
                                            {product.isCustomRequest ? (
                                                <span className="text-sm italic bg-purple-50 px-2 py-1 rounded">Price on Request</span>
                                            ) : product.variants && product.variants.length > 0 ? (
                                                <span className="flex flex-col items-center">
                                                    <span className="text-[10px] uppercase tracking-tighter opacity-70">Starting From</span>
                                                    <span>₹{Math.min(...product.variants.map(v => v.price)).toLocaleString('en-IN')}</span>
                                                </span>
                                            ) : (
                                                <>₹{parseFloat(product.price.toString()).toLocaleString('en-IN')}</>
                                            )}
                                        </p>
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