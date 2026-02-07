import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductContext';
import { ShoppingBag, Star, Heart, Minus, Plus, Eye, X, Check, Share2 } from 'lucide-react';
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

    const [selectedVariant, setSelectedVariant] = useState<import('@/data/products').ProductVariant | null>(null);

    const [customRequestForm, setCustomRequestForm] = useState<any>({
        name: '', email: '', phone: '', requestedText: '', referenceImage: '', customFields: {}
    });
    const [requestSuccess, setRequestSuccess] = useState(false);

    const handleCustomRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        // Build fields array for email with dynamic labels
        const allFields: { label: string; value: any }[] = [];

        // Add default fields with their customized labels
        const defaultFields = (product.defaultFormFields || [
            { id: 'name', label: 'Name' },
            { id: 'email', label: 'Email' },
            { id: 'phone', label: 'Phone' },
            { id: 'requestedText', label: 'Requested Text' }
        ]);

        defaultFields.forEach((field: any) => {
            if (field.id === 'image') return; // Handled separately

            let val = '';
            if (field.id === 'name') val = customRequestForm.name;
            else if (field.id === 'email') val = customRequestForm.email;
            else if (field.id === 'phone') val = customRequestForm.phone;
            else if (field.id === 'requestedText') val = customRequestForm.requestedText;

            allFields.push({ label: field.label, value: val });
        });

        // Add custom fields
        if (product.customFormConfig) {
            product.customFormConfig.forEach((field: any) => {
                allFields.push({
                    label: field.label,
                    value: customRequestForm.customFields[field.id] || ''
                });
            });
        }

        try {
            const response = await fetch(`/api/custom-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...customRequestForm,
                    productName: product.name,
                    allFields: allFields // Send everything here
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                setRequestSuccess(true);
                setCustomRequestForm({ name: '', email: '', phone: '', requestedText: '', referenceImage: '', customFields: {} });
            } else {
                alert("Failed to send request.");
            }
        } catch (error) {
            console.error(error);
            alert("Error sending request.");
        }
    };

    const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomRequestForm({ ...customRequestForm, referenceImage: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const averageRating = product?.reviews?.length
        ? (product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length).toFixed(1)
        : null;

    const handleSubmitReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        const reviewPayload = {
            userName: reviewForm.name,
            email: reviewForm.email,
            rating: reviewForm.rating,
            comment: reviewForm.comment,
            date: new Date().toISOString()
        };

        addReview(product.id, reviewPayload)
            .then(() => {
                setReviewForm({ name: '', email: '', rating: 5, comment: '', saveInfo: false });
                alert("Review submitted successfully!");
            })
            .catch(() => {
                alert("Failed to submit review.");
            });
    };

    useEffect(() => {
        if (product) {
            setMainImage(product.image);
            setQuantity(1);
            if (product.variants && product.variants.length > 0) {
                setSelectedVariant(product.variants[0]);
            } else {
                setSelectedVariant(null);
            }
        }
    }, [product]);

    useEffect(() => {
        if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
            setMainImage(selectedVariant.images[0]);
        }
    }, [selectedVariant]);

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

    const relatedProducts = products
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 4);

    return (
        <MainLayout>
            <Helmet>
                <title>{product.name} - Kottravai</title>
            </Helmet>

            <div className="bg-[#FAF9F6] py-4 border-b border-gray-100">
                <div className="container mx-auto px-4 text-sm text-gray-500">
                    <Link to="/" className="hover:text-[#8E2A8B]">Home</Link>
                    <span className="mx-2">/</span>
                    <Link to="/shop" className="hover:text-[#8E2A8B]">Shop</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 font-medium">{product.name}</span>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="flex flex-col lg:flex-row gap-12 mb-16">
                    <div className="lg:w-1/2">
                        <div className="bg-gray-50 rounded-2xl overflow-hidden mb-4 border border-gray-100 h-[400px] md:h-[500px]">
                            <img src={mainImage || product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        {product.images && product.images.length > 0 && (
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setMainImage(img)}
                                        className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${mainImage === img ? 'border-[#8E2A8B]' : 'border-transparent hover:border-gray-300'}`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="lg:w-1/2">
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#2D1B4E] mb-4">{product.name}</h1>

                        <div className="flex items-center gap-4 mb-2">
                            {product.isCustomRequest ? (
                                <span className="text-2xl font-bold text-[#8E2A8B] bg-purple-50 px-4 py-2 rounded-lg border border-purple-100 italic">Price on Request</span>
                            ) : (
                                <span className="text-3xl font-bold text-[#8E2A8B]">₹{Number(selectedVariant ? selectedVariant.price * quantity : product.price * quantity).toFixed(2)}</span>
                            )}
                            <div className="flex items-center gap-1 text-yellow-400">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} size={16} fill={Number(averageRating) >= star ? "currentColor" : "none"} className={Number(averageRating) >= star ? "text-yellow-400" : "text-gray-300"} />
                                ))}
                                <span className="text-xs text-gray-400 ml-1">
                                    {averageRating ? `(${averageRating}/5 based on ${product.reviews?.length} reviews)` : '(No reviews yet)'}
                                </span>
                            </div>
                        </div>

                        {/* Variant Selection UI */}
                        {!product.isCustomRequest && product.variants && product.variants.length > 0 && (
                            <div className="mb-6 space-y-3">
                                <label className="block text-sm font-bold text-gray-700">Select Weight / Size</label>
                                <div className="flex flex-wrap gap-3">
                                    {product.variants.map((variant, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedVariant(variant)}
                                            className={`px-4 py-2 rounded-lg border-2 transition-all font-bold text-sm ${selectedVariant?.weight === variant.weight ? 'border-[#8E2A8B] bg-[#8E2A8B] text-white shadow-md' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                                        >
                                            {variant.weight} - ₹{variant.price}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="prose text-gray-600 mb-8 leading-relaxed">
                            {product.shortDescription || product.description || "Handcrafted with love and sustainable materials."}
                        </div>

                        <div className="mb-8 pb-8 border-b border-gray-100">
                            {/* Conditional Rendering: Custom Request Form vs Standard Cart */}
                            {product.isCustomRequest ? (
                                requestSuccess ? (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm text-center">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Check size={32} className="text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-green-800 mb-2">Request Sent Successfully!</h3>
                                        <p className="text-green-700 mb-4">Thank you for your interest. Our team will review your request and contact you within 24 hours.</p>
                                        <button
                                            onClick={() => setRequestSuccess(false)}
                                            className="text-green-800 font-bold underline hover:text-green-900"
                                        >
                                            Send another request
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                        <h3 className="text-xl font-bold text-[#2D1B4E] mb-4">Request Customization</h3>
                                        <p className="text-sm text-gray-500 mb-6">Fill out the details below, and our team will get back to you within 24 hours.</p>

                                        <form onSubmit={handleCustomRequestSubmit} className="space-y-4">
                                            {/* All Fields - Rendered Dynamically from Config */}
                                            {(product.defaultFormFields && product.defaultFormFields.length > 0 ? product.defaultFormFields : [
                                                { id: 'name', label: 'Name to Print', placeholder: 'Enter the name exactly as you want', type: 'text', required: true },
                                                { id: 'email', label: 'Email Address', placeholder: 'Enter your email address', type: 'email', required: true },
                                                { id: 'phone', label: 'Phone Number', placeholder: 'Enter your phone number', type: 'tel', required: true }
                                            ]).map((field: any) => {
                                                if (field.id === 'image') return null; // Handled separately below

                                                let value = '';
                                                let onChange = (_val: string) => { };

                                                if (field.id === 'name' || field.id === 'requestedText') {
                                                    value = customRequestForm.name || customRequestForm.requestedText || '';
                                                    onChange = (val: string) => setCustomRequestForm({ ...customRequestForm, name: val, requestedText: val });
                                                } else if (field.id === 'email') {
                                                    value = customRequestForm.email;
                                                    onChange = (v) => setCustomRequestForm({ ...customRequestForm, email: v });
                                                } else if (field.id === 'phone') {
                                                    value = customRequestForm.phone;
                                                    onChange = (v) => setCustomRequestForm({ ...customRequestForm, phone: v });
                                                } else {
                                                    value = customRequestForm.customFields[field.id] || '';
                                                    onChange = (v) => setCustomRequestForm({
                                                        ...customRequestForm,
                                                        customFields: { ...customRequestForm.customFields, [field.id]: v }
                                                    });
                                                }

                                                return (
                                                    <div key={field.id} className={field.id === 'email' || field.id === 'phone' ? 'col-span-1' : ''}>
                                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                                            {field.label}{field.required !== false && ' *'}
                                                        </label>
                                                        {field.type === 'textarea' ? (
                                                            <textarea
                                                                required={field.required !== false}
                                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none"
                                                                value={value}
                                                                onChange={e => onChange(e.target.value)}
                                                                placeholder={field.placeholder || ''}
                                                                rows={3}
                                                            />
                                                        ) : (
                                                            <input
                                                                type={field.type}
                                                                required={field.required !== false}
                                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none"
                                                                value={value}
                                                                onChange={e => onChange(e.target.value)}
                                                                placeholder={field.placeholder || ''}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* Custom form config fields (if not already rendered) */}
                                            {product.customFormConfig && product.customFormConfig
                                                .filter(field => !product.defaultFormFields?.find(df => df.id === field.id))
                                                .map((field) => (
                                                    <div key={field.id}>
                                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                                            {field.label}{field.required !== false && ' *'}
                                                        </label>
                                                        {field.type === 'textarea' ? (
                                                            <textarea
                                                                required={field.required !== false}
                                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none"
                                                                value={customRequestForm.customFields[field.id] || ''}
                                                                onChange={e => setCustomRequestForm({
                                                                    ...customRequestForm,
                                                                    customFields: { ...customRequestForm.customFields, [field.id]: e.target.value }
                                                                })}
                                                                placeholder={field.placeholder || ''}
                                                                rows={3}
                                                            />
                                                        ) : (
                                                            <input
                                                                type={field.type}
                                                                required={field.required !== false}
                                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none"
                                                                value={customRequestForm.customFields[field.id] || ''}
                                                                onChange={e => setCustomRequestForm({
                                                                    ...customRequestForm,
                                                                    customFields: { ...customRequestForm.customFields, [field.id]: e.target.value }
                                                                })}
                                                                placeholder={field.placeholder || ''}
                                                            />
                                                        )}
                                                    </div>
                                                ))}

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                                    {(product.defaultFormFields?.find((f: any) => f.id === 'image' || f.id === 'image')?.label) || 'Reference Image (Optional)'}
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleCustomImageUpload}
                                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#8E2A8B]/10 file:text-[#8E2A8B] hover:file:bg-[#8E2A8B]/20"
                                                    required={product.defaultFormFields?.find((f: any) => f.id === 'image')?.required}
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full h-12 rounded-full font-bold uppercase tracking-wider transition-all bg-[#2D1B4E] text-white hover:bg-[#8E2A8B] flex items-center justify-center gap-2 mt-2 shadow-lg hover:shadow-xl"
                                            >
                                                Send Request
                                            </button>
                                        </form>
                                    </div>
                                )
                            ) : (
                                <>
                                    {/* Row 1: Quantity + Add to Cart */}
                                    <div className="flex gap-4 mb-4 h-12">
                                        {/* Quantity Selector */}
                                        <div className="flex items-center bg-gray-50 rounded-full px-2 border border-gray-200">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="w-10 h-full flex items-center justify-center hover:text-[#8E2A8B] transition"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="w-10 h-full flex items-center justify-center hover:text-[#8E2A8B] transition"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        {/* Add to Cart Button */}
                                        <button
                                            onClick={handleAddToCart}
                                            className={`flex-1 rounded-full font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${isInCart
                                                ? 'bg-gray-200 text-gray-800 hover:bg-red-100 hover:text-red-700'
                                                : 'bg-black text-white hover:bg-gray-800'
                                                }`}
                                        >
                                            {isInCart ? (
                                                <>
                                                    <Check size={20} /> Added
                                                </>
                                            ) : (
                                                "Add To Cart"
                                            )}
                                        </button>
                                    </div>

                                    {/* Row 2: Buy Now */}
                                    <div className="mb-6">
                                        <button
                                            onClick={() => {
                                                if (!isInCart) addToCart(product, quantity, selectedVariant || undefined);
                                                navigate('/checkout');
                                            }}
                                            className="w-full h-12 rounded-full font-bold uppercase tracking-wider transition-all border border-black bg-white text-black hover:bg-gray-50 flex items-center justify-center gap-2"
                                        >
                                            Buy Now
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Row 3: Wishlist & Share */}
                            <div className="flex items-center gap-8">
                                <button className="flex items-center gap-3 group text-gray-700 hover:text-black transition-colors">
                                    <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-black transition-colors">
                                        <Heart size={18} />
                                    </div>
                                    <span className="font-medium text-sm">Add to wishlist</span>
                                </button>

                                <button className="flex items-center gap-3 group text-gray-700 hover:text-black transition-colors">
                                    <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-black transition-colors">
                                        <Share2 size={18} />
                                    </div>
                                    <span className="font-medium text-sm">Share</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm text-gray-500">
                            <div className="flex gap-2">
                                <span className="font-bold text-[#2D1B4E] min-w-[100px]">Category:</span>
                                <span className="text-[#8E2A8B]">{product.category}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold text-[#2D1B4E] min-w-[100px]">Availability:</span>
                                <span className="text-green-600 font-medium">In Stock</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-20">


                    <div className="flex gap-10 border-b border-gray-200 mb-8 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('description')}
                            className={`pb-4 text-xl font-bold transition-all relative whitespace-nowrap ${activeTab === 'description' ? 'text-black border-b-4 border-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Description
                        </button>
                        <button
                            onClick={() => setActiveTab('specifications')}
                            className={`pb-4 text-xl font-bold transition-all relative whitespace-nowrap ${activeTab === 'specifications' ? 'text-black border-b-4 border-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Specifications
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`pb-4 text-xl font-bold transition-all relative whitespace-nowrap ${activeTab === 'reviews' ? 'text-black border-b-4 border-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Reviews ({product.reviews?.length || 0})
                        </button>
                    </div>

                    <div className="bg-white min-h-[300px]">
                        {activeTab === 'description' && (
                            <div className="max-w-4xl text-gray-700 leading-relaxed space-y-8">
                                <div className="text-lg leading-relaxed whitespace-pre-wrap">
                                    {product.description || "No full description available."}
                                </div>

                                {product.keyFeatures && product.keyFeatures.length > 0 && (
                                    <div>
                                        <h3 className="text-2xl font-bold mb-4 text-black">Key Features:</h3>
                                        <ul className="list-disc list-inside space-y-3 text-gray-700 marker:text-black">
                                            {product.keyFeatures.map((feature, idx) => (
                                                <li key={idx} className="pl-2">{feature}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'specifications' && (
                            <div className="max-w-4xl">
                                {product.features && product.features.length > 0 ? (
                                    <div className="border border-gray-100 rounded-lg">
                                        <table className="w-full text-left bg-white">
                                            <tbody className="divide-y divide-gray-100">
                                                {product.features.map((feature, idx) => {
                                                    const parts = feature.split(':');
                                                    const hasKey = parts.length > 1;
                                                    const key = hasKey ? parts[0].trim() : `Feature ${idx + 1}`;
                                                    const value = hasKey ? parts.slice(1).join(':').trim() : feature;
                                                    return (
                                                        <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                                            <th className="py-6 px-6 font-bold uppercase text-black w-1/4 align-top text-sm tracking-wide">
                                                                {key}:
                                                            </th>
                                                            <td className="py-6 px-6 text-gray-600 text-base leading-relaxed align-top">
                                                                {value}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No specifications declared for this product.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="grid md:grid-cols-1 gap-12">
                                <div>
                                    <h3 className="text-xl font-bold mb-6 text-black">{product.reviews?.length ? `${product.reviews.length} Reviews for ${product.name}` : 'No reviews yet'}</h3>
                                    {product.reviews && product.reviews.length > 0 ? (
                                        <div className="space-y-6 mb-8">
                                            {product.reviews.map((review) => (
                                                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="flex text-yellow-500">
                                                            {[1, 2, 3, 4, 5].map(star => <Star key={star} size={14} fill={review.rating >= star ? "currentColor" : "none"} className={review.rating >= star ? "" : "text-gray-300"} />)}
                                                        </div>
                                                        <span className="font-bold text-gray-900">{review.userName}</span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm italic mb-2">"{review.comment}"</p>
                                                    <p className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-gray-500 italic mb-8">Be the first to review this product!</p>}
                                    <button onClick={() => setIsReviewPanelOpen(true)} className="px-8 py-3 border border-black text-black font-bold rounded-full hover:bg-black hover:text-white transition-colors">Write A Review</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {isReviewPanelOpen && <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={() => setIsReviewPanelOpen(false)} />}
                <div className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white z-[60] shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${isReviewPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-8">
                        <div className="flex justify-end mb-4">
                            <button onClick={() => setIsReviewPanelOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-500" /></button>
                        </div>
                        <div className="border border-black p-4 mb-8 text-center bg-white"><h3 className="text-lg font-medium">{product.reviews && product.reviews.length > 0 ? `Leave a Review for "${product.name}"` : `Be the first to review "${product.name}"`}</h3></div>
                        <p className="text-sm text-gray-600 mb-6">Your email address will not be published. Required fields are marked <span className="text-red-500">*</span></p>
                        <form onSubmit={handleSubmitReview} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Your rating</label>
                                <div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })} className={`focus:outline-none transition-colors ${reviewForm.rating >= star ? 'text-gray-400' : 'text-gray-200 hover:text-gray-300'}`}><Star size={24} fill="currentColor" /></button>)}</div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Your Reviews <span className="text-red-500">*</span></label><textarea required className="w-full border border-gray-200 rounded p-3 focus:outline-none focus:border-gray-400 min-h-[150px] text-sm" value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}></textarea></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Name <span className="text-red-500">*</span></label><input type="text" required className="w-full border border-gray-200 rounded p-3 focus:outline-none focus:border-gray-400 text-sm" value={reviewForm.name} onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })} /></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label><input type="email" required className="w-full border border-gray-200 rounded p-3 focus:outline-none focus:border-gray-400 text-sm" value={reviewForm.email} onChange={e => setReviewForm({ ...reviewForm, email: e.target.value })} /></div></div>
                            <div className="flex items-start gap-2"><input type="checkbox" id="saveInfo" className="mt-1 rounded border-gray-300 text-black focus:ring-black" checked={reviewForm.saveInfo} onChange={e => setReviewForm({ ...reviewForm, saveInfo: e.target.checked })} /><label htmlFor="saveInfo" className="text-sm text-gray-600">Save my name, email, and website in this browser for the next time I comment.</label></div>
                            <button type="submit" className="px-10 py-3 border border-black text-black font-medium rounded-full hover:bg-black hover:text-white transition-colors">Submit</button>
                        </form>
                    </div>
                </div>

                {relatedProducts.length > 0 && (
                    <div className="border-t border-gray-100 pt-16">
                        <h3 className="text-2xl font-bold text-[#2D1B4E] mb-8 font-serif">Related Products</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {relatedProducts.map((relProduct) => {
                                const relIsInCart = cart.some(item => item.id === relProduct.id);
                                return (
                                    <div key={relProduct.id} className="group block">
                                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all mb-3 relative h-[250px]">
                                            <img src={relProduct.image} alt={relProduct.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (relIsInCart) removeFromCart(relProduct.id);
                                                        else addToCart(relProduct);
                                                    }}
                                                    className={`p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 transition-colors ${relIsInCart ? 'bg-[#8E2A8B] text-white' : 'bg-white text-gray-900 hover:bg-[#8E2A8B] hover:text-white'}`}
                                                    title={relIsInCart ? "Remove from Cart" : "Add to Cart"}
                                                >
                                                    {relIsInCart ? <Check size={18} /> : <ShoppingBag size={18} />}
                                                </button>
                                                <Link to={`/product/${relProduct.slug}`} className="p-3 bg-white text-gray-900 rounded-full hover:bg-[#8E2A8B] hover:text-white transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75">
                                                    <Eye size={18} />
                                                </Link>
                                            </div>
                                        </div>
                                        <Link to={`/product/${relProduct.slug}`}>
                                            <h4 className="font-bold text-gray-900 group-hover:text-[#8E2A8B] transition-colors truncate">{relProduct.name}</h4>
                                            <div className="text-[#8E2A8B] font-bold mt-1">₹{Number(relProduct.price).toFixed(2)}</div>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default ProductDetails;