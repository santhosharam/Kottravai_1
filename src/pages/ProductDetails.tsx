import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductContext';
import { ShoppingBag, Star, Heart, Minus, Plus, X, Check, Share2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateWhatsAppLink, openWhatsApp } from '@/utils/whatsapp';
import WhatsAppConfirmModal from '@/components/whatsapp/WhatsAppConfirmModal';

const ProductDetails = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart, cart, removeFromCart } = useCart();
    const { products, addReview } = useProducts();

    const product = products.find(p => p.slug === slug);

    const [mainImage, setMainImage] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
    const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(false);

    const [reviewForm, setReviewForm] = useState({
        name: '', email: '', rating: 5, comment: '', saveInfo: false
    });

    const [selectedVariant, setSelectedVariant] = useState<any>(null);

    // Custom Request State
    const [isCustomRequestOpen, setIsCustomRequestOpen] = useState(false);
    const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
    const [customForm, setCustomForm] = useState({
        name: '', email: '', phone: '', message: '', referenceImage: ''
    });

    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

    const handleWhatsAppOrder = (city?: string) => {
        const link = generateWhatsAppLink({
            productName: product?.name || '',
            productId: product?.id || '',
            price: selectedVariant ? selectedVariant.price * quantity : (product?.price || 0) * quantity,
            quantity: quantity,
            size: selectedVariant?.weight,
            customerCity: city
        });
        openWhatsApp(link);
        setIsWhatsAppModalOpen(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomForm({ ...customForm, referenceImage: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCustomSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingCustom(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/custom-request`, {
                productName: product?.name,
                name: customForm.name,
                email: customForm.email,
                phone: customForm.phone,
                requestedText: customForm.message,
                referenceImage: customForm.referenceImage
            });
            toast.success('Custom request sent successfully! We will contact you soon.');
            setIsCustomRequestOpen(false);
            setCustomForm({ name: '', email: '', phone: '', message: '', referenceImage: '' });
        } catch (err) {
            console.error(err);
            toast.error('Failed to send request. Please try again.');
        } finally {
            setIsSubmittingCustom(false);
        }
    };


    useEffect(() => {
        if (product) {
            setMainImage(product.image);
            if (product.variants && product.variants.length > 0) {
                setSelectedVariant(product.variants[0]);
            }
        }
        window.scrollTo(0, 0);
    }, [product]);

    if (!product) {
        return (
            <MainLayout>
                <div className="container mx-auto px-4 py-20 text-center">
                    <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
                    <Link to="/shop" className="text-[#8E2A8B] underline">Back to Shop</Link>
                </div>
            </MainLayout>
        );
    }

    const isInCart = cart.some(item =>
        item.id === product.id &&
        (!selectedVariant || item.selectedVariant?.weight === selectedVariant.weight)
    );

    const handleAddToCart = () => {
        if (isInCart) {
            removeFromCart(product.id, selectedVariant?.weight);
        } else {
            addToCart(product, quantity, selectedVariant || undefined);
        }
    };


    const handleSubmitReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (product) {
            addReview(product.id, {
                userName: reviewForm.name,
                rating: reviewForm.rating,
                comment: reviewForm.comment,
                date: new Date().toISOString()
            });
            setIsReviewPanelOpen(false);
            setReviewForm({ name: '', email: '', rating: 5, comment: '', saveInfo: false });
        }
    };

    const averageRating = product.reviews?.length
        ? (product.reviews.reduce((acc, rev) => acc + rev.rating, 0) / product.reviews.length).toFixed(1)
        : null;

    const relatedProducts = products
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 4);

    return (
        <MainLayout>
            <Helmet>
                <title>{product.name} - Kottravai</title>
            </Helmet>

            <div className="bg-[#FAF9F6] py-3 md:py-4 border-b border-gray-100">
                <div className="container mx-auto px-4 text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-widest">
                    <Link to="/" className="hover:text-[#8E2A8B]">Home</Link>
                    <span className="mx-2">/</span>
                    <Link to="/shop" className="hover:text-[#8E2A8B]">Shop</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">{product.name}</span>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-16">
                    {/* Image Section */}
                    <div className="lg:w-1/2">
                        <div className="bg-white md:bg-gray-50 rounded-[2rem] overflow-hidden mb-4 border border-gray-100 h-[380px] sm:h-[450px] md:h-[550px] shadow-sm md:shadow-none flex items-center justify-center p-4">
                            <img src={mainImage || product.image} alt={product.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                        </div>
                        {product.images && product.images.length > 0 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setMainImage(img)}
                                        className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${mainImage === img ? 'border-[#8E2A8B] shadow-md' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="lg:w-1/2">
                        <div className="mb-2">
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[#b5128f] opacity-60">{product.category}</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-[#2D1B4E] mb-6 leading-[1.1]">{product.name}</h1>

                        <div className="flex items-center gap-4 mb-8">
                            {product.isCustomRequest ? (
                                <span className="text-2xl font-bold text-[#8E2A8B] bg-purple-50 px-5 py-3 rounded-2xl border border-purple-100 italic">Price on Request</span>
                            ) : (
                                <span className="text-4xl font-black text-[#b5128f]">₹{Number(selectedVariant ? selectedVariant.price * quantity : product.price * quantity).toLocaleString('en-IN')}</span>
                            )}
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-0.5 text-yellow-400">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} size={14} fill={Number(averageRating) >= star ? "currentColor" : "none"} className={Number(averageRating) >= star ? "text-yellow-400" : "text-gray-200"} />
                                    ))}
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                    {averageRating ? `${averageRating}/5 (${product.reviews?.length} Reviews)` : 'No reviews yet'}
                                </span>
                            </div>
                        </div>

                        {/* Variant Selection */}
                        {!product.isCustomRequest && product.variants && product.variants.length > 0 && (
                            <div className="mb-8 space-y-4">
                                <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">Select Grams</label>
                                <div className="flex flex-wrap gap-3">
                                    {product.variants.map((variant, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedVariant(variant)}
                                            className={`min-w-[80px] px-4 py-2 rounded-xl border-2 transition-all font-bold text-sm ${selectedVariant?.weight === variant.weight ? 'border-[#b5128f] bg-[#b5128f] text-white shadow-lg shadow-[#b5128f]/20' : 'border-gray-100 text-gray-600 hover:border-[#b5128f] hover:text-[#b5128f]'}`}
                                        >
                                            {variant.weight}{/^\d+$/.test(variant.weight) ? 'g' : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="prose prose-sm text-gray-500 mb-10 leading-relaxed font-medium">
                            {product.shortDescription || product.description || "Handcrafted with love and organic materials."}
                        </div>

                        {!product.isCustomRequest ? (
                            <div className="space-y-6 mb-12">
                                <div className="flex gap-4 h-16">
                                    {/* Quantity */}
                                    <div className="flex items-center bg-gray-50 rounded-[1.25rem] px-3 border border-gray-100">
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center text-gray-400 hover:text-black transition"><Minus size={18} /></button>
                                        <span className="w-10 text-center font-black text-xl">{quantity}</span>
                                        <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-full flex items-center justify-center text-gray-400 hover:text-black transition"><Plus size={18} /></button>
                                    </div>

                                    {/* Cart */}
                                    <button
                                        onClick={handleAddToCart}
                                        className={`flex-1 rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${isInCart ? 'bg-gray-100 text-gray-400' : 'bg-[#b5128f] text-white shadow-xl shadow-[#b5128f]/20 hover:scale-[1.02] active:scale-95'}`}
                                    >
                                        {isInCart ? <><Check size={18} /> In Your Bag</> : <><ShoppingBag size={18} /> Add To Cart</>}
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        if (!isInCart) addToCart(product, quantity, selectedVariant || undefined);
                                        navigate('/checkout');
                                    }}
                                    className="w-full h-16 rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-xs transition-all border-2 border-black bg-black text-white hover:bg-transparent hover:text-black active:scale-95"
                                >
                                    Instant Checkout
                                </button>
                                <button
                                    onClick={() => setIsWhatsAppModalOpen(true)}
                                    className="w-full h-16 rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-xs transition-all border-2 border-[#25D366] bg-[#25D366] text-white hover:bg-transparent hover:text-[#25D366] flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-green-500/10"
                                >
                                    <MessageCircle size={20} />
                                    Order on WhatsApp
                                </button>
                            </div>
                        ) : (
                            <div className="mb-12">
                                <button onClick={() => setIsCustomRequestOpen(true)} className="w-full h-16 bg-black text-white rounded-[1.25rem] font-black uppercase tracking-widest text-xs hover:bg-[#b5128f] transition-colors">Request Customization</button>
                            </div>
                        )}

                        <div className="flex items-center gap-10 pt-8 border-t border-gray-50">
                            <button className="flex items-center gap-3 group">
                                <div className="w-11 h-11 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-red-50 group-hover:border-red-100 transition-all"><Heart size={18} className="group-hover:text-red-500 transition-colors" /></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black">Wishlist</span>
                            </button>
                            <button onClick={() => navigator.share && navigator.share({ title: product.name, url: window.location.href })} className="flex items-center gap-3 group">
                                <div className="w-11 h-11 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-100 transition-all"><Share2 size={18} className="group-hover:text-blue-500 transition-colors" /></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black">Share</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs & Content */}
                <div className="mt-20">
                    <div className="flex gap-8 border-b border-gray-100 mb-12 overflow-x-auto no-scrollbar">
                        {(['description', 'specifications', 'reviews'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-6 text-sm font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-[#b5128f]' : 'text-gray-300 hover:text-gray-500'}`}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#b5128f] animate-in slide-in-from-left duration-300"></div>}
                            </button>
                        ))}
                    </div>

                    <div className="w-full">
                        {activeTab === 'description' && (
                            <div className="text-gray-500 leading-loose font-medium space-y-8 animate-in fade-in duration-500">
                                <div className="text-base whitespace-pre-wrap">{product.description}</div>
                                {product.keyFeatures && (
                                    <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                                        <h4 className="text-[#2D1B4E] font-black uppercase tracking-widest text-sm mb-6">Key Highlights</h4>
                                        <ul className="grid sm:grid-cols-2 gap-4">
                                            {product.keyFeatures.map((f, i) => (
                                                <li key={i} className="flex items-center gap-3 text-sm"><div className="w-2 h-2 rounded-full bg-[#b5128f]"></div> {f}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'specifications' && (
                            <div className="animate-in fade-in duration-500">
                                <div className="border border-gray-100 rounded-[2rem] overflow-hidden">
                                    <table className="w-full">
                                        <tbody className="divide-y divide-gray-100">
                                            {product.features?.map((f, i) => {
                                                const [k, v] = f.split(':');
                                                return (
                                                    <tr key={i} className="hover:bg-gray-50/50">
                                                        <td className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400 w-1/3">{k}</td>
                                                        <td className="p-6 text-sm font-bold text-[#2D1B4E]">{v}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="animate-in fade-in duration-500 space-y-12">
                                <div className="space-y-8">
                                    {product.reviews && product.reviews.length > 0 ? (
                                        product.reviews.map((rev) => (
                                            <div key={rev.id} className="bg-gray-50 p-8 rounded-[2rem]">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-[#b5128f] shadow-sm">{rev.userName[0]}</div>
                                                    <div>
                                                        <h5 className="font-bold text-[#2D1B4E]">{rev.userName}</h5>
                                                        <div className="flex text-yellow-400 scale-75 -ml-4">
                                                            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={rev.rating >= s ? "currentColor" : "none"} />)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-gray-500 leading-relaxed italic">"{rev.comment}"</p>
                                            </div>
                                        ))
                                    ) : <p className="text-gray-400 italic">No reviews yet. Share your experience!</p>}
                                </div>
                                <button onClick={() => setIsReviewPanelOpen(true)} className="bg-black text-white px-10 py-5 rounded-[1.25rem] font-black uppercase tracking-widest text-xs hover:bg-[#b5128f] transition-colors">Write Your Review</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-32 pt-20 border-t border-gray-100">
                        <h3 className="text-4xl font-black text-[#2D1B4E] mb-12">Related <span className="text-[#b5128f]">Excellence</span></h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                            {relatedProducts.map(rel => (
                                <Link key={rel.id} to={`/product/${rel.slug}`} className="group">
                                    <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-all h-[250px] md:h-[300px]">
                                        <img src={rel.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    </div>
                                    <h4 className="font-bold text-[#2D1B4E] group-hover:text-[#b5128f] transition-colors truncate px-2">{rel.name}</h4>
                                    <p className="text-[#b5128f] font-black mt-1 px-2">₹{rel.price}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Sticky Bar */}
            {!product.isCustomRequest && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-6 animate-in slide-in-from-bottom duration-500 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400">Final Total</span>
                        <span className="text-xl font-black text-[#b5128f]">₹{Number(selectedVariant ? selectedVariant.price * quantity : product.price * quantity).toLocaleString('en-IN')}</span>
                    </div>
                    <button
                        onClick={() => {
                            if (!isInCart) addToCart(product, quantity, selectedVariant || undefined);
                            navigate('/checkout');
                        }}
                        className="flex-1 bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 active:scale-95 transition-all"
                    >
                        Checkout Now
                    </button>
                </div>
            )}

            {/* Review Modal */}
            {isReviewPanelOpen && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#2D1B4E]/40 backdrop-blur-sm" onClick={() => setIsReviewPanelOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom duration-500">
                        <button onClick={() => setIsReviewPanelOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
                        <h3 className="text-3xl font-black text-[#2D1B4E] mb-2">Share Your Story</h3>
                        <p className="text-gray-400 text-sm mb-8 font-medium">Your feedback inspires our craftsmanship.</p>

                        <form onSubmit={handleSubmitReview} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Rate Your Experience</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button key={s} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: s })} className={`transition-colors ${reviewForm.rating >= s ? 'text-yellow-400' : 'text-gray-100 hover:text-gray-200'}`}><Star size={32} fill="currentColor" /></button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <input required placeholder="Your Professional Name" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-[#b5128f]/20 outline-none" value={reviewForm.name} onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })} />
                                <textarea required rows={4} placeholder="Your Detailed Experience..." className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-[#b5128f]/20 outline-none" value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}></textarea>
                            </div>
                            <button type="submit" className="w-full bg-[#b5128f] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#b5128f]/20 hover:bg-[#910e73] transition-all active:scale-95">Post Review</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Request Modal */}
            {isCustomRequestOpen && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#2D1B4E]/40 backdrop-blur-sm" onClick={() => setIsCustomRequestOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setIsCustomRequestOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
                        <h3 className="text-3xl font-black text-[#2D1B4E] mb-2">Custom Request</h3>
                        <p className="text-gray-400 text-sm mb-8 font-medium">Tell us what you need, and we'll craft it for you.</p>

                        <form onSubmit={handleCustomSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <input required placeholder="Your Name" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-[#b5128f]/20 outline-none" value={customForm.name} onChange={e => setCustomForm({ ...customForm, name: e.target.value })} />
                                <input required type="email" placeholder="Email Address" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-[#b5128f]/20 outline-none" value={customForm.email} onChange={e => setCustomForm({ ...customForm, email: e.target.value })} />
                                <input required type="tel" placeholder="Phone Number" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-[#b5128f]/20 outline-none" value={customForm.phone} onChange={e => setCustomForm({ ...customForm, phone: e.target.value })} />

                                <textarea rows={4} placeholder="Describe your custom requirement..." className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-[#b5128f]/20 outline-none" value={customForm.message} onChange={e => setCustomForm({ ...customForm, message: e.target.value })}></textarea>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Reference Image (Optional)</label>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                                    {customForm.referenceImage && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check size={12} /> Image selected</p>}
                                </div>
                            </div>
                            <button type="submit" disabled={isSubmittingCustom} className="w-full bg-[#b5128f] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#b5128f]/20 hover:bg-[#910e73] transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                                {isSubmittingCustom ? 'Sending...' : 'Send Request'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <WhatsAppConfirmModal
                isOpen={isWhatsAppModalOpen}
                onClose={() => setIsWhatsAppModalOpen(false)}
                onConfirm={handleWhatsAppOrder}
                productName={product.name}
            />
        </MainLayout>
    );
};

export default ProductDetails;