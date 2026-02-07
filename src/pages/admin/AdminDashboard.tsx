import { useState } from 'react';
import { useProducts } from '@/context/ProductContext';
import { useVideos } from '@/context/VideoContext';
import { useNews } from '@/context/NewsContext';
import { useReviews } from '@/context/ReviewContext';
import { useOrders } from '../../context/OrderContext';
import { usePartners } from '@/context/PartnerContext';
import { Link } from 'react-router-dom';
import { Plus, Image as ImageIcon, Trash2, X, Upload, Pencil, MessageSquareQuote, Package, ShoppingBag, ChevronDown, ChevronUp, LayoutDashboard, TrendingUp, DollarSign, Handshake, Video, Newspaper } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { categories } from '@/data/products';


const AdminDashboard = () => {
    const { products, addProduct, deleteProduct, updateProduct, updateStock } = useProducts();
    const { videos, addVideo, deleteVideo, updateVideo } = useVideos();
    const { newsItems, addNewsItem, deleteNewsItem, updateNewsItem } = useNews();
    const { addReview, deleteReview, updateReview, getReviewsByPage } = useReviews();
    const { adminOrders: orders, updateOrderStatus, deleteOrder } = useOrders();
    const { partners, addPartner, updatePartner, deletePartner } = usePartners();

    const [view, setView] = useState<'dashboard' | 'list' | 'add' | 'videos' | 'news' | 'reviews' | 'stocks' | 'orders' | 'partners'>('dashboard');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Video Form State
    const [newVideo, setNewVideo] = useState({ title: '', url: '' });
    const [editingVideoId, setEditingVideoId] = useState<number | null>(null);

    // News Form State
    const [newsForm, setNewsForm] = useState({ title: '', category: '', date: '', image: '', link: '' });
    const [editingNewsId, setEditingNewsId] = useState<number | null>(null);

    // Review Form State
    const [reviewPage, setReviewPage] = useState<'home' | 'b2b'>('home');
    const [reviewForm, setReviewForm] = useState({ name: '', role: '', content: '', image: '', rating: 5 });
    const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

    // Partner Form State
    const [partnerForm, setPartnerForm] = useState({ name: '', logo: '' });
    const [editingPartnerId, setEditingPartnerId] = useState<number | null>(null);


    const filteredReviews = getReviewsByPage(reviewPage);

    // Calculate dynamic stats
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;

    // Calculate growth (comparing this month vs last month)
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthOrders = orders.filter(o => new Date(o.date) >= thisMonthStart);
    const lastMonthOrders = orders.filter(o => {
        const d = new Date(o.date);
        return d >= lastMonthStart && d < thisMonthStart;
    });

    const thisMonthSales = thisMonthOrders.reduce((sum, order) => sum + order.total, 0);
    const lastMonthSales = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);

    const salesGrowth = lastMonthSales === 0 ? (thisMonthSales > 0 ? 12 : 0) : ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100;
    const ordersGrowth = lastMonthOrders.length === 0 ? (thisMonthOrders.length > 0 ? 5 : 0) : ((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100;


    // Filter products by category slug
    const filteredProducts = selectedCategory === 'all'
        ? products
        : products.filter(p => p.categorySlug === selectedCategory);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: categories[0]?.slug || '', // Use slug for value
        description: '',
        shortDescription: '',
        keyFeatures: '',
        specifications: '',

        reviews: '',
        isBestSeller: false,
        isCustomRequest: false,
        defaultFormFields: [
            { id: 'name', label: 'Name to Print', placeholder: 'Enter the name exactly as you want', type: 'text' as const, required: true, isDefault: true },
            { id: 'email', label: 'Email Address', placeholder: 'Enter your email address', type: 'email' as const, required: true, isDefault: true },
            { id: 'phone', label: 'Phone Number', placeholder: 'Enter your phone number', type: 'tel' as const, required: true, isDefault: true },
            { id: 'image', label: 'Reference Image', placeholder: 'Upload reference image (optional)', type: 'file' as const, required: false, isDefault: true }
        ],
        customFormConfig: [] as { id: string; label: string; type: 'text' | 'textarea' | 'number'; placeholder?: string; required?: boolean }[],
        variants: [] as { weight: string; price: number; images: string[] }[]
    });

    const [mainImage, setMainImage] = useState<string>('');
    const [otherImages, setOtherImages] = useState<string[]>([]);

    // File Handlers
    const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMainImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNewsImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewsForm({ ...newsForm, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleOtherImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setOtherImages(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleEdit = (product: any) => {
        setEditingId(product.id);

        // Find slug from category name for proper select value
        const catObj = categories.find(c => c.name === product.category);
        const catSlug = catObj ? catObj.slug : categories[0].slug;

        setFormData({
            name: product.name,
            price: product.price.toString(),
            category: catSlug,
            description: product.description || '',
            shortDescription: product.shortDescription || '', // assuming property exists or optional
            keyFeatures: product.keyFeatures ? product.keyFeatures.join('\n') : '',
            specifications: product.features ? product.features.join('\n') : '',

            reviews: '',
            isBestSeller: product.isBestSeller || false,
            isCustomRequest: product.isCustomRequest || false,
            defaultFormFields: product.defaultFormFields || [
                { id: 'name', label: 'Name to Print', placeholder: 'Enter the name exactly as you want', type: 'text' as const, required: true, isDefault: true },
                { id: 'email', label: 'Email Address', placeholder: 'Enter your email address', type: 'email' as const, required: true, isDefault: true },
                { id: 'phone', label: 'Phone Number', placeholder: 'Enter your phone number', type: 'tel' as const, required: true, isDefault: true },
                { id: 'image', label: 'Reference Image', placeholder: 'Upload reference image (optional)', type: 'file' as const, required: false, isDefault: true }
            ],
            customFormConfig: product.customFormConfig || [],
            variants: product.variants || []
        });
        setMainImage(product.image);
        setOtherImages(product.images || []);
        setView('add');
    };

    const resetForm = () => {
        setFormData({
            name: '',
            price: '',
            category: categories[0]?.slug || '',
            description: '',
            shortDescription: '',
            keyFeatures: '',
            specifications: '',

            reviews: '',
            isBestSeller: false,
            isCustomRequest: false,
            defaultFormFields: [
                { id: 'name', label: 'Name to Print', placeholder: 'Enter the name exactly as you want', type: 'text' as const, required: true, isDefault: true },
                { id: 'email', label: 'Email Address', placeholder: 'Enter your email address', type: 'email' as const, required: true, isDefault: true },
                { id: 'phone', label: 'Phone Number', placeholder: 'Enter your phone number', type: 'tel' as const, required: true, isDefault: true },
                { id: 'image', label: 'Reference Image', placeholder: 'Upload reference image (optional)', type: 'file' as const, required: false, isDefault: true }
            ],
            customFormConfig: [],
            variants: []
        });
        setMainImage('');
        setOtherImages([]);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation
        if (!formData.name.trim()) return alert("Product Name is required");
        if (!formData.isCustomRequest && (!formData.price || isNaN(parseFloat(formData.price)))) return alert("Please enter a valid price");
        if (!formData.category) return alert("Please select a category");
        if (!mainImage) return alert("Main Product Image is required");

        // Find category name from slug
        const categoryObj = categories.find(c => c.slug === formData.category);
        const categoryName = categoryObj ? categoryObj.name : 'Uncategorized';

        try {
            // Find existing product to preserve reviews if editing
            const existingProduct = products.find(p => p.id === editingId);
            const existingReviews = existingProduct?.reviews || [];

            const productData = {
                id: editingId || Date.now().toString(),
                name: formData.name,
                price: formData.isCustomRequest ? 0 : parseFloat(formData.price),
                category: categoryName, // Storing name
                categorySlug: formData.category, // Storing slug for logic
                slug: formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                image: mainImage,
                images: otherImages,
                shortDescription: formData.shortDescription,
                description: formData.description,
                keyFeatures: formData.keyFeatures.split('\n').filter(f => f.trim() !== ''),
                features: formData.specifications.split('\n').filter(f => f.trim() !== ''),
                reviews: existingReviews, // Preserve reviews
                isBestSeller: formData.isBestSeller,
                isCustomRequest: formData.isCustomRequest,
                defaultFormFields: formData.defaultFormFields,
                customFormConfig: formData.customFormConfig,
                variants: formData.variants
            };

            if (editingId) {
                await updateProduct(productData);
                alert('Product Updated Successfully!');
            } else {
                await addProduct(productData);
                alert('Product Added Successfully!');
            }

            setView('list');
            resetForm();

        } catch (error: any) {
            console.error("Failed to save product:", error);
            const errorMessage = error.response?.data?.error || error.message || "Unknown error";
            alert(`Failed to save product: ${errorMessage}`);
        }
    }


    const handleAddVideo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVideo.title || !newVideo.url) return alert("Please fill in both fields");

        // Simple embed conversion if user pastes full URL
        let embedUrl = newVideo.url;
        if (newVideo.url.includes('watch?v=')) {
            embedUrl = newVideo.url.replace('watch?v=', 'embed/');
        } else if (newVideo.url.includes('youtu.be/')) {
            embedUrl = newVideo.url.replace('youtu.be/', 'www.youtube.com/embed/');
        }

        if (editingVideoId) {
            updateVideo({ id: editingVideoId, title: newVideo.title, url: embedUrl });
            setEditingVideoId(null);
            alert("Video updated successfully");
        } else {
            addVideo({ title: newVideo.title, url: embedUrl });
            alert("Video added successfully");
        }

        setNewVideo({ title: '', url: '' });
    };

    const handleEditVideo = (video: any) => {
        setEditingVideoId(video.id);
        setNewVideo({ title: video.title, url: video.url });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelVideoEdit = () => {
        setEditingVideoId(null);
        setNewVideo({ title: '', url: '' });
    };

    // News Handlers
    const handleAddNews = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsForm.title || !newsForm.category || !newsForm.date || !newsForm.link) return alert("Please fill all fields");

        const newsData = { ...newsForm };

        if (editingNewsId) {
            updateNewsItem({ id: editingNewsId, ...newsData });
            setEditingNewsId(null);
            alert("News updated successfully");
        } else {
            addNewsItem(newsData);
            alert("News added successfully");
        }
        setNewsForm({ title: '', category: '', date: '', image: '', link: '' });
    };

    const handleEditNews = (news: any) => {
        setEditingNewsId(news.id);
        setNewsForm({
            title: news.title,
            category: news.category,
            date: news.date,
            image: news.image,
            link: news.link
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelNewsEdit = () => {
        setEditingNewsId(null);
        setNewsForm({ title: '', category: '', date: '', image: '', link: '' });
    };

    // Review Handlers
    const handleAddReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewForm.name || !reviewForm.content) return alert("All fields are required");

        const reviewData = {
            ...reviewForm,
            page: reviewPage
        };

        if (editingReviewId) {
            updateReview({ id: editingReviewId, ...reviewData });
            setEditingReviewId(null);
            alert("Review updated successfully");
        } else {
            addReview(reviewData);
            alert("Review added successfully");
        }
        setReviewForm({ name: '', role: '', content: '', image: '', rating: 5 });
    };

    const handleEditReview = (review: any) => {
        setEditingReviewId(review.id);
        setReviewForm({
            name: review.name,
            role: review.role,
            content: review.content,
            image: review.image,
            rating: review.rating || 5
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelReviewEdit = () => {
        setEditingReviewId(null);
        setReviewForm({ name: '', role: '', content: '', image: '', rating: 5 });
    };

    const handleReviewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReviewForm({ ...reviewForm, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    // Partner Handlers
    const handleAddPartner = (e: React.FormEvent) => {
        e.preventDefault();
        if (!partnerForm.name) return alert("Partner Name is required");

        const partnerData = { ...partnerForm };

        if (editingPartnerId) {
            updatePartner({ id: editingPartnerId, ...partnerData });
            setEditingPartnerId(null);
            alert("Partner updated successfully");
        } else {
            addPartner(partnerData);
            alert("Partner added successfully");
        }
        setPartnerForm({ name: '', logo: '' });
    };

    const handleEditPartner = (partner: any) => {
        setEditingPartnerId(partner.id);
        setPartnerForm({
            name: partner.name,
            logo: partner.logo || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelPartnerEdit = () => {
        setEditingPartnerId(null);
        setPartnerForm({ name: '', logo: '' });
    };

    const handlePartnerLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPartnerForm({ ...partnerForm, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeOtherImage = (index: number) => {
        setOtherImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-[#2D1B4E] text-white flex-shrink-0 hidden md:block">
                <div className="p-6 border-b border-gray-700">
                    <div className="flex flex-col items-center gap-2">
                        <img src="/kottravai-logo-full.png" alt="Kottravai" className="w-full max-w-[150px] h-auto object-contain" />
                        <span className="text-[#8E2A8B] text-xs font-bold tracking-[0.2em] mt-1">ADMIN PANEL</span>
                    </div>
                </div>
                <nav className="p-4 space-y-8">
                    {/* Dashboard Section */}
                    <div className="space-y-2">
                        <button
                            onClick={() => { setView('dashboard'); resetForm(); setSelectedCategory('all'); }}
                            className={`w-full text-left px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-3 ${view === 'dashboard' ? 'bg-[#8E2A8B] text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                        >
                            <LayoutDashboard size={18} />
                            Dashboard
                        </button>
                    </div>
                    {/* Products Section */}
                    <div className="space-y-2">
                        <h3 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Products</h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => { setSelectedCategory('all'); setView('list'); resetForm(); }}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-3 ${selectedCategory === 'all' && view === 'list' ? 'bg-[#8E2A8B] text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                            >
                                <ImageIcon size={18} />
                                All Products
                            </button>
                            <button
                                onClick={() => { setView('stocks'); resetForm(); setSelectedCategory('all'); }}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-3 ${view === 'stocks' ? 'bg-[#8E2A8B] text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                            >
                                <Package size={18} />
                                Stocks
                            </button>
                            <button
                                onClick={() => { setView('orders'); resetForm(); setSelectedCategory('all'); }}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-3 ${view === 'orders' ? 'bg-[#8E2A8B] text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                            >
                                <ShoppingBag size={18} />
                                Orders
                            </button>
                        </div>
                    </div>

                    {/* Website Section */}
                    <div className="space-y-2">
                        <h3 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Website</h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => { setView('reviews'); resetForm(); setSelectedCategory('reviews'); }}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-3 ${view === 'reviews' ? 'bg-[#8E2A8B] text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                            >
                                <MessageSquareQuote size={18} /> Manage Reviews
                            </button>
                            <button
                                onClick={() => { setView('news'); resetForm(); setSelectedCategory('news'); }}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-3 ${view === 'news' ? 'bg-[#8E2A8B] text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                            >
                                <Newspaper size={18} /> Manage News
                            </button>
                            <button
                                onClick={() => { setView('videos'); resetForm(); setSelectedCategory('videos'); }}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-3 ${view === 'videos' ? 'bg-[#8E2A8B] text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                            >
                                <Video size={18} /> Manage Videos
                            </button>
                            <button
                                onClick={() => { setView('partners'); resetForm(); setSelectedCategory('partners'); }}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-3 ${view === 'partners' ? 'bg-[#8E2A8B] text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                            >
                                <Handshake size={18} /> Manage Trusted By
                            </button>
                        </div>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {view === 'dashboard' ? 'Overview' : view === 'videos' ? 'Manage Videos' : view === 'news' ? 'Manage News' : view === 'reviews' ? 'Manage Reviews' : view === 'stocks' ? 'Inventory Management' : view === 'orders' ? 'Order Management' : view === 'partners' ? 'Manage Trusted Partners' : view === 'add' ? (editingId ? 'Edit Product' : 'Add New Product') : (selectedCategory === 'all' ? 'All Products' : categories.find(c => c.slug === selectedCategory)?.name || selectedCategory)}
                    </h2>
                    <div className="flex gap-4">
                        <Link to="/" className="text-[#8E2A8B] hover:underline font-medium">Visit Site</Link>
                        {view === 'list' && (
                            <button
                                onClick={() => { resetForm(); setView('add'); }}
                                className="bg-[#8E2A8B] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#722270] transition-colors shadow-lg"
                            >
                                <Plus size={18} /> Add Product
                            </button>
                        )}
                    </div>
                </header>

                <div className="p-8">
                    {view === 'dashboard' ? (
                        <div className="max-w-6xl mx-auto space-y-8">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Sales</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-2">₹{totalSales.toLocaleString()}</h3>
                                        </div>
                                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                            <DollarSign size={24} />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <TrendingUp size={16} className={`${salesGrowth >= 0 ? 'text-green-500' : 'text-red-500'} mr-1`} />
                                        <span className={`${salesGrowth >= 0 ? 'text-green-500' : 'text-red-500'} font-bold`}>{salesGrowth >= 0 ? '+' : ''}{salesGrowth.toFixed(1)}%</span>
                                        <span className="text-gray-400 ml-1">from last month</span>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Orders</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-2">{totalOrders}</h3>
                                        </div>
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            <ShoppingBag size={24} />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <TrendingUp size={16} className={`${ordersGrowth >= 0 ? 'text-green-500' : 'text-red-500'} mr-1`} />
                                        <span className={`${ordersGrowth >= 0 ? 'text-green-500' : 'text-red-500'} font-bold`}>{ordersGrowth >= 0 ? '+' : ''}{ordersGrowth.toFixed(1)}%</span>
                                        <span className="text-gray-400 ml-1">from last month</span>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Products</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-2">{products.length}</h3>
                                        </div>
                                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                            <Package size={24} />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <span className="text-gray-400">Inventory Status</span>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Reviews</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-2">{filteredReviews.length}</h3>
                                        </div>
                                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                            <MessageSquareQuote size={24} />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <span className="text-gray-400">Across all pages</span>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6">Sales Growth</h3>
                                    <div className="h-80 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={[
                                                    { name: 'Jan', sales: 4000 },
                                                    { name: 'Feb', sales: 3000 },
                                                    { name: 'Mar', sales: 2000 },
                                                    { name: 'Apr', sales: 2780 },
                                                    { name: 'May', sales: 1890 },
                                                    { name: 'Jun', sales: 2390 },
                                                    { name: 'Jul', sales: 3490 },
                                                ]}
                                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8E2A8B" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#8E2A8B" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <Tooltip />
                                                <Area type="monotone" dataKey="sales" stroke="#8E2A8B" fillOpacity={1} fill="url(#colorSales)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6">Visitor Insights</h3>
                                    <div className="h-80 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={[
                                                    { name: 'Mon', visitors: 240 },
                                                    { name: 'Tue', visitors: 139 },
                                                    { name: 'Wed', visitors: 980 },
                                                    { name: 'Thu', visitors: 390 },
                                                    { name: 'Fri', visitors: 480 },
                                                    { name: 'Sat', visitors: 380 },
                                                    { name: 'Sun', visitors: 430 },
                                                ]}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="visitors" fill="#2D1B4E" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : view === 'videos' ? (
                        <div className="space-y-8 max-w-5xl mx-auto">
                            {/* Add Video Form */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-4">Add New Video</h3>
                                <form onSubmit={handleAddVideo} className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 space-y-1 w-full">
                                        <label className="text-sm font-bold text-gray-700">Video Title</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                            placeholder="e.g. Kottravai in Action"
                                            value={newVideo.title}
                                            onChange={e => setNewVideo({ ...newVideo, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1 w-full">
                                        <label className="text-sm font-bold text-gray-700">YouTube URL</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            value={newVideo.url}
                                            onChange={e => setNewVideo({ ...newVideo, url: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        {editingVideoId && (
                                            <button
                                                type="button"
                                                onClick={cancelVideoEdit}
                                                className="bg-gray-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-600 transition-colors flex-shrink-0"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className="bg-[#2D1B4E] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#8E2A8B] transition-colors flex-shrink-0"
                                        >
                                            {editingVideoId ? 'Update Video' : 'Add Video'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Video List */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-6">Current Videos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {videos.map(video => (
                                        <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden group relative">
                                            <div className="aspect-video bg-gray-100 relative">
                                                <iframe
                                                    className="w-full h-full"
                                                    src={video.url}
                                                    title={video.title}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    loading="lazy"
                                                ></iframe>
                                            </div>
                                            <div className="p-4">
                                                <h4 className="font-bold text-gray-800 leading-tight mb-2 line-clamp-2">{video.title}</h4>
                                                <div className="flex justify-between items-center mt-4">
                                                    <span className="text-xs text-gray-400">ID: {video.id}</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditVideo(video)}
                                                            className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-full transition-colors"
                                                            title="Edit Video"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteVideo(video.id)}
                                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                            title="Delete Video"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {videos.length === 0 && (
                                        <div className="col-span-full text-center py-10 text-gray-400">
                                            No videos added yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : view === 'news' ? (
                        <div className="space-y-8 max-w-5xl mx-auto">
                            {/* Add News Form */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-4">{editingNewsId ? 'Edit News' : 'Add New News'}</h3>
                                <form onSubmit={handleAddNews} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700">Title</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                                value={newsForm.title}
                                                onChange={e => setNewsForm({ ...newsForm, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700">Category</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                                placeholder="e.g. Innovation"
                                                value={newsForm.category}
                                                onChange={e => setNewsForm({ ...newsForm, category: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700">Date</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                                placeholder="e.g. June 01, 2025"
                                                value={newsForm.date}
                                                onChange={e => setNewsForm({ ...newsForm, date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700">Read More Link</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                                value={newsForm.link}
                                                onChange={e => setNewsForm({ ...newsForm, link: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Image Upload for News */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">News Image</label>
                                        <div className="flex items-center gap-4">
                                            {newsForm.image && (
                                                <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={newsForm.image} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                                Upload Image
                                                <input type="file" className="hidden" accept="image/*" onChange={handleNewsImageUpload} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        {editingNewsId && (
                                            <button
                                                type="button"
                                                onClick={cancelNewsEdit}
                                                className="bg-gray-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className="bg-[#2D1B4E] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#8E2A8B] transition-colors"
                                        >
                                            {editingNewsId ? 'Update News' : 'Add News'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* News List */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-6">Current News Items</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {newsItems.map(item => (
                                        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden group">
                                            <div className="h-48 bg-gray-100 relative">
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs font-bold text-[#8E2A8B] uppercase tracking-wider">{item.category}</span>
                                                    <span className="text-xs text-gray-400">{item.date}</span>
                                                </div>
                                                <h4 className="font-bold text-gray-800 leading-tight mb-4 line-clamp-2">{item.title}</h4>
                                                <div className="flex justify-end gap-2 mt-auto">
                                                    <button
                                                        onClick={() => handleEditNews(item)}
                                                        className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-full transition-colors"
                                                        title="Edit News"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteNewsItem(item.id)}
                                                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                        title="Delete News"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {newsItems.length === 0 && (
                                        <div className="col-span-full text-center py-10 text-gray-400">
                                            No news items added yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : view === 'reviews' ? (
                        <div className="space-y-8 max-w-5xl mx-auto">
                            {/* Review Page Selector */}
                            <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <button
                                    onClick={() => { setReviewPage('home'); cancelReviewEdit(); }}
                                    className={`px-6 py-2 rounded-lg font-bold transition-all ${reviewPage === 'home' ? 'bg-[#8E2A8B] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Home Page Reviews
                                </button>
                                <button
                                    onClick={() => { setReviewPage('b2b'); cancelReviewEdit(); }}
                                    className={`px-6 py-2 rounded-lg font-bold transition-all ${reviewPage === 'b2b' ? 'bg-[#8E2A8B] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    B2B Page Reviews
                                </button>
                            </div>

                            {/* Add/Edit Review Form */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-4">{editingReviewId ? 'Edit Review' : `Add New Review (${reviewPage === 'home' ? 'Home' : 'B2B'})`}</h3>
                                <form onSubmit={handleAddReview} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700">Name</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                                value={reviewForm.name}
                                                onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700">Role / Title</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                                value={reviewForm.role}
                                                onChange={e => setReviewForm({ ...reviewForm, role: e.target.value })}
                                                placeholder={reviewPage === 'b2b' ? 'e.g. CEO, Company Name' : 'e.g. Customer - Location'}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">Content</label>
                                        <textarea
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B] h-32"
                                            value={reviewForm.content}
                                            onChange={e => setReviewForm({ ...reviewForm, content: e.target.value })}
                                        ></textarea>
                                    </div>

                                    {/* Image Upload for Review */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">Profile Image (Optional)</label>
                                        <div className="flex items-center gap-4">
                                            {reviewForm.image && (
                                                <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200">
                                                    <img src={reviewForm.image} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                                Upload Image
                                                <input type="file" className="hidden" accept="image/*" onChange={handleReviewImageUpload} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        {editingReviewId && (
                                            <button
                                                type="button"
                                                onClick={cancelReviewEdit}
                                                className="bg-gray-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className="bg-[#2D1B4E] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#8E2A8B] transition-colors"
                                        >
                                            {editingReviewId ? 'Update Review' : 'Add Review'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Reviews List */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-6">Current Reviews</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {filteredReviews.map(review => (
                                        <div key={review.id} className="border border-gray-200 rounded-lg p-4 flex gap-4 items-start">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                                                {review.image ? <img src={review.image} alt={review.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{review.name}</h4>
                                                        <p className="text-xs text-[#8E2A8B] font-bold uppercase tracking-wider">{review.role}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleEditReview(review)} className="text-blue-500 hover:text-blue-700 p-1"><Pencil size={16} /></button>
                                                        <button onClick={() => deleteReview(review.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 text-sm mt-2">{review.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredReviews.length === 0 && (
                                        <div className="text-center py-8 text-gray-400">No reviews found for this page.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : view === 'partners' ? (
                        <div className="space-y-8 max-w-5xl mx-auto">
                            {/* Add Partner Form */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-4">{editingPartnerId ? 'Edit Trusted Partner' : 'Add New Trusted Partner'}</h3>
                                <form onSubmit={handleAddPartner} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">Partner Name</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B]"
                                            value={partnerForm.name}
                                            onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })}
                                            placeholder="e.g. Company Name"
                                        />
                                    </div>

                                    {/* Logo Upload */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">Logo</label>
                                        <div className="flex items-center gap-4">
                                            {partnerForm.logo ? (
                                                <div className="w-32 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center p-2">
                                                    <img src={partnerForm.logo} alt="Preview" className="max-w-full max-h-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="w-32 h-16 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                                                    No Logo
                                                </div>
                                            )}
                                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                                Upload Logo
                                                <input type="file" className="hidden" accept="image/*" onChange={handlePartnerLogoUpload} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        {editingPartnerId && (
                                            <button
                                                type="button"
                                                onClick={cancelPartnerEdit}
                                                className="bg-gray-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className="bg-[#2D1B4E] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#8E2A8B] transition-colors"
                                        >
                                            {editingPartnerId ? 'Update Partner' : 'Add Partner'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Partners List */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-[#2D1B4E] mb-6">Current Trusted Partners</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {partners.map(partner => (
                                        <div key={partner.id} className="border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-between h-40 bg-gray-50 group relative">
                                            <div className="flex-1 flex items-center justify-center w-full p-2">
                                                {partner.logo ? (
                                                    <img src={partner.logo} alt={partner.name} className="max-w-full max-h-20 object-contain" />
                                                ) : (
                                                    <span className="text-gray-500 font-bold text-center">{partner.name}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium mt-2">{partner.name}</p>

                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditPartner(partner)} className="bg-white text-blue-500 p-1.5 rounded-full shadow-sm hover:text-blue-700"><Pencil size={14} /></button>
                                                <button onClick={() => deletePartner(partner.id)} className="bg-white text-red-500 p-1.5 rounded-full shadow-sm hover:text-red-700"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {partners.length === 0 && (
                                        <div className="col-span-full text-center py-10 text-gray-400">
                                            No partners added yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : view === 'add' ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-4xl mx-auto">
                            <h3 className="text-lg font-bold text-[#2D1B4E] mb-6">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Product Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all"
                                            placeholder="Product Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-gray-700">Price (₹)</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="isCustomRequest"
                                                    checked={formData.isCustomRequest}
                                                    onChange={e => setFormData({ ...formData, isCustomRequest: e.target.checked, price: e.target.checked ? '0' : formData.price })}
                                                    className="w-4 h-4 rounded text-[#8E2A8B] focus:ring-[#8E2A8B] border-gray-300"
                                                />
                                                <label htmlFor="isCustomRequest" className="text-xs font-bold text-[#8E2A8B] cursor-pointer select-none">
                                                    Use Customization Form
                                                </label>
                                            </div>
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all ${formData.isCustomRequest ? 'bg-gray-100 text-gray-400' : ''}`}
                                            placeholder="0.00"
                                            disabled={formData.isCustomRequest}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all bg-white"
                                        >
                                            <option value="" disabled>Select a category</option>
                                            {categories.filter(c => !c.parent).map(parent => (
                                                <optgroup key={parent.slug} label={parent.name}>
                                                    <option value={parent.slug}>--- General {parent.name} ---</option>
                                                    {categories.filter(c => c.parent === parent.slug).map(sub => (
                                                        <option key={sub.slug} value={sub.slug}>{sub.name}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 flex items-center gap-3 pt-2">
                                        <input
                                            type="checkbox"
                                            id="isBestSeller"
                                            checked={formData.isBestSeller}
                                            onChange={e => setFormData({ ...formData, isBestSeller: e.target.checked })}
                                            className="w-5 h-5 rounded text-[#8E2A8B] focus:ring-[#8E2A8B] border-gray-300"
                                        />
                                        <label htmlFor="isBestSeller" className="text-sm font-bold text-gray-700 select-none cursor-pointer">
                                            Mark as Best Seller (Show on Home Page)
                                        </label>
                                    </div>

                                    {/* Custom Form Builder - Table View */}
                                    {formData.isCustomRequest && (
                                        <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-[#2D1B4E] text-lg">Custom Form Fields</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        customFormConfig: [...prev.customFormConfig, { id: Date.now().toString(), label: '', type: 'text', placeholder: '', required: true }]
                                                    }))}
                                                    className="bg-[#2D1B4E] text-white px-4 py-2 rounded-lg hover:bg-[#8E2A8B] transition flex items-center gap-2"
                                                >
                                                    <Plus size={16} />
                                                    Add Field
                                                </button>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                                                            <th className="text-left px-4 py-3 font-bold text-sm text-gray-700">Field Label</th>
                                                            <th className="text-left px-4 py-3 font-bold text-sm text-gray-700">Placeholder Text</th>
                                                            <th className="text-left px-4 py-3 font-bold text-sm text-gray-700">Field Type</th>
                                                            <th className="text-center px-4 py-3 font-bold text-sm text-gray-700">Required</th>
                                                            <th className="text-center px-4 py-3 font-bold text-sm text-gray-700">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {/* Default Fields - Now Editable */}
                                                        {formData.defaultFormFields.map((field, index) => (
                                                            <tr key={field.id} className="border-b border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 transition">
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="text"
                                                                        value={field.label}
                                                                        onChange={(e) => {
                                                                            const newFields = [...formData.defaultFormFields];
                                                                            newFields[index].label = e.target.value;
                                                                            setFormData({ ...formData, defaultFormFields: newFields });
                                                                        }}
                                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none bg-white"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="text"
                                                                        value={field.placeholder}
                                                                        onChange={(e) => {
                                                                            const newFields = [...formData.defaultFormFields];
                                                                            newFields[index].placeholder = e.target.value;
                                                                            setFormData({ ...formData, defaultFormFields: newFields });
                                                                        }}
                                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none bg-white"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <select
                                                                        value={field.type}
                                                                        onChange={(e) => {
                                                                            const newFields = [...formData.defaultFormFields];
                                                                            newFields[index].type = e.target.value as any;
                                                                            setFormData({ ...formData, defaultFormFields: newFields });
                                                                        }}
                                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none bg-white"
                                                                    >
                                                                        <option value="text">Text</option>
                                                                        <option value="email">Email</option>
                                                                        <option value="tel">Phone</option>
                                                                        <option value="file">File Upload</option>
                                                                        <option value="textarea">Long Text</option>
                                                                        <option value="number">Number</option>
                                                                    </select>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={field.required}
                                                                        onChange={(e) => {
                                                                            const newFields = [...formData.defaultFormFields];
                                                                            newFields[index].required = e.target.checked;
                                                                            setFormData({ ...formData, defaultFormFields: newFields });
                                                                        }}
                                                                        className="w-4 h-4 rounded text-[#8E2A8B] focus:ring-[#8E2A8B] border-gray-300"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Default</span>
                                                                </td>
                                                            </tr>
                                                        ))}

                                                        {/* Custom Fields - Editable */}
                                                        {formData.customFormConfig.map((field, index) => (
                                                            <tr key={field.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition">
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="text"
                                                                        value={field.label}
                                                                        onChange={(e) => {
                                                                            const newConfig = [...formData.customFormConfig];
                                                                            newConfig[index].label = e.target.value;
                                                                            setFormData({ ...formData, customFormConfig: newConfig });
                                                                        }}
                                                                        placeholder="e.g., Size, Color"
                                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="text"
                                                                        value={field.placeholder || ''}
                                                                        onChange={(e) => {
                                                                            const newConfig = [...formData.customFormConfig];
                                                                            newConfig[index].placeholder = e.target.value;
                                                                            setFormData({ ...formData, customFormConfig: newConfig });
                                                                        }}
                                                                        placeholder="Enter placeholder text"
                                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <select
                                                                        value={field.type}
                                                                        onChange={(e) => {
                                                                            const newConfig = [...formData.customFormConfig];
                                                                            newConfig[index].type = e.target.value as any;
                                                                            setFormData({ ...formData, customFormConfig: newConfig });
                                                                        }}
                                                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none bg-white"
                                                                    >
                                                                        <option value="text">Text</option>
                                                                        <option value="textarea">Long Text</option>
                                                                        <option value="number">Number</option>
                                                                    </select>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={field.required !== false}
                                                                        onChange={(e) => {
                                                                            const newConfig = [...formData.customFormConfig];
                                                                            newConfig[index].required = e.target.checked;
                                                                            setFormData({ ...formData, customFormConfig: newConfig });
                                                                        }}
                                                                        className="w-4 h-4 rounded text-[#8E2A8B] focus:ring-[#8E2A8B] border-gray-300"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newConfig = formData.customFormConfig.filter((_, i) => i !== index);
                                                                            setFormData({ ...formData, customFormConfig: newConfig });
                                                                        }}
                                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                                                                        title="Delete field"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {formData.customFormConfig.length === 0 && (
                                                <p className="text-sm text-gray-400 italic text-center py-4 bg-gray-50 rounded mt-4">
                                                    No custom fields added. Default fields (Name, Email, Phone, Image) will be used.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Product Variants Section */}
                                    <div className="space-y-4 pt-6 border-t border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="text-md font-bold text-[#2D1B4E]">Product Variants (Weight-based)</h4>
                                                <p className="text-xs text-gray-500">Add different weights, prices, and images for this product.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    variants: [...prev.variants, { weight: '', price: 0, images: [] }]
                                                }))}
                                                className="bg-[#2D1B4E] text-white px-4 py-2 rounded-lg hover:bg-[#8E2A8B] transition flex items-center gap-2 text-sm font-bold"
                                            >
                                                <Plus size={16} />
                                                Add Variant
                                            </button>
                                        </div>

                                        {formData.variants.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {formData.variants.map((variant, index) => (
                                                    <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newVariants = formData.variants.filter((_, i) => i !== index);
                                                                setFormData({ ...formData, variants: newVariants });
                                                            }}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-bold text-gray-700">Weight / Size</label>
                                                                <input
                                                                    type="text"
                                                                    value={variant.weight}
                                                                    onChange={(e) => {
                                                                        const newVariants = [...formData.variants];
                                                                        newVariants[index].weight = e.target.value;
                                                                        setFormData({ ...formData, variants: newVariants });
                                                                    }}
                                                                    placeholder="e.g. 500g, 1kg"
                                                                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-bold text-gray-700">Price (₹)</label>
                                                                <input
                                                                    type="number"
                                                                    value={variant.price || ''}
                                                                    onChange={(e) => {
                                                                        const newVariants = [...formData.variants];
                                                                        newVariants[index].price = parseFloat(e.target.value);
                                                                        setFormData({ ...formData, variants: newVariants });
                                                                    }}
                                                                    placeholder="Price"
                                                                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 space-y-1">
                                                            <label className="text-xs font-bold text-gray-700">Variant Images</label>
                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                {(variant.images || []).map((img, imgIdx) => (
                                                                    <div key={imgIdx} className="relative w-10 h-10 rounded border border-gray-300 overflow-hidden group/img">
                                                                        <img src={img} className="w-full h-full object-cover" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newVariants = [...formData.variants];
                                                                                newVariants[index].images = newVariants[index].images.filter((_, i) => i !== imgIdx);
                                                                                setFormData({ ...formData, variants: newVariants });
                                                                            }}
                                                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover/img:opacity-100"
                                                                        >
                                                                            <X size={8} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded text-[10px] font-bold hover:bg-gray-50 transition-colors inline-block uppercase tracking-wider">
                                                                Upload Images
                                                                <input
                                                                    type="file"
                                                                    multiple
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        const files = e.target.files;
                                                                        if (files) {
                                                                            Array.from(files).forEach(file => {
                                                                                const reader = new FileReader();
                                                                                reader.onloadend = () => {
                                                                                    const newVariants = [...formData.variants];
                                                                                    newVariants[index].images = [...(newVariants[index].images || []), reader.result as string];
                                                                                    setFormData({ ...formData, variants: newVariants });
                                                                                };
                                                                                reader.readAsDataURL(file);
                                                                            });
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                                <p className="text-sm text-gray-500 italic">No weight variants added. Default price and images will be used.</p>
                                            </div>
                                        )}
                                    </div>

                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Short Description</label>
                                    <input
                                        type="text"
                                        value={formData.shortDescription}
                                        onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all"
                                        placeholder="Brief summary used in cards"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Full Description</label>
                                    <textarea
                                        rows={4}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all"
                                        placeholder="Detailed description..."
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Key Features (One per line)</label>
                                        <textarea
                                            rows={4}
                                            value={formData.keyFeatures}
                                            onChange={e => setFormData({ ...formData, keyFeatures: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all"
                                            placeholder="- Feature 1&#10;- Feature 2"
                                        ></textarea>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Specifications (One per line)</label>
                                        <textarea
                                            rows={4}
                                            value={formData.specifications}
                                            onChange={e => setFormData({ ...formData, specifications: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none transition-all"
                                            placeholder="- Spec 1&#10;- Spec 2"
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Image Uploads */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Main Image</label>
                                        <div className="flex items-center gap-4">
                                            {mainImage && (
                                                <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={mainImage} alt="Main" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <label className="cursor-pointer bg-purple-50 hover:bg-purple-100 text-[#8E2A8B] px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                                <Upload size={16} />
                                                Upload Cover
                                                <input type="file" className="hidden" accept="image/*" onChange={handleMainImageUpload} />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Gallery Images</label>
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                {otherImages.map((img, idx) => (
                                                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                                                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeOtherImage(idx)}
                                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-2">
                                                <Upload size={16} />
                                                Add Images
                                                <input type="file" multiple className="hidden" accept="image/*" onChange={handleOtherImagesUpload} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => { setView('list'); resetForm(); }}
                                        className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-[#2D1B4E] text-white rounded-lg font-bold hover:bg-[#8E2A8B] transition-colors shadow-lg"
                                    >
                                        {editingId ? 'Save Changes' : 'Create Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : view === 'stocks' ? (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#2D1B4E] text-white">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Product</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Current Stock</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Update Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {products.map(product => (
                                            <tr key={product.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <span className="font-medium text-gray-900">{product.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.stock && product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock && product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                        {product.stock || 0} units
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateStock(product.id, Math.max(0, (product.stock || 0) - 1))}
                                                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors"
                                                        >
                                                            <ChevronDown size={16} />
                                                        </button>
                                                        <span className="w-8 text-center font-bold">{product.stock || 0}</span>
                                                        <button
                                                            onClick={() => updateStock(product.id, (product.stock || 0) + 1)}
                                                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-600 transition-colors"
                                                        >
                                                            <ChevronUp size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : view === 'orders' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Orders</h4>
                                    <p className="text-3xl font-bold text-[#2D1B4E]">{orders.length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Pending Processing</h4>
                                    <p className="text-3xl font-bold text-orange-500">{orders.filter(o => o.status === 'Pending').length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Revenue</h4>
                                    <p className="text-3xl font-bold text-green-600">₹{orders.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#2D1B4E] text-white">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Order ID</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Items</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Total</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.map(order => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <div className="flex flex-col">
                                                        <span>#{order.id.slice(0, 8)}...</span>
                                                        {order.orderId && <span className="text-[10px] text-gray-400">{order.orderId}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{order.customerName}</span>
                                                        <span className="text-xs text-gray-500">{order.customerEmail}</span>
                                                        <div className="flex flex-col mt-1 space-y-0.5">
                                                            {order.customerPhone && <span className="text-[10px] text-gray-400">📞 {order.customerPhone}</span>}
                                                            {order.address && <span className="text-[10px] text-gray-400 truncate max-w-[200px]" title={order.address}>🏠 {order.address}</span>}
                                                            {order.city && <span className="text-[10px] text-gray-400">📍 {order.city}, {order.pincode}</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        {Array.isArray(order.items) ? order.items.map((item: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-2 text-xs">
                                                                <span className="font-bold text-gray-800">{item.quantity}x</span>
                                                                <span className="text-gray-600 truncate max-w-[150px]" title={item.name}>{item.name}</span>
                                                            </div>
                                                        )) : <span className="text-gray-400 italic text-xs">No items</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{new Date(order.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 font-bold text-[#8E2A8B]">₹{order.total}</td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-[#8E2A8B] ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                                                order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                            }`}
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Processing">Processing</option>
                                                        <option value="Shipped">Shipped</option>
                                                        <option value="Delivered">Delivered</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => deleteOrder(order.id)}
                                                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                        title="Delete Order"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No orders found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                                <h3 className="text-lg font-bold text-[#2D1B4E]">All Products</h3>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-[#8E2A8B] focus:border-[#8E2A8B] outline-none"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.filter(c => !c.parent).map(parent => (
                                        <optgroup key={parent.slug} label={parent.name}>
                                            <option value={parent.slug}>--- General {parent.name} ---</option>
                                            {categories.filter(c => c.parent === parent.slug).map(sub => (
                                                <option key={sub.slug} value={sub.slug}>{sub.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-[#2D1B4E] text-white">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredProducts.map(product => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="font-bold text-gray-800">{product.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-600 uppercase tracking-wide">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-[#8E2A8B]">₹{product.price}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEdit(product)} className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-full transition-colors" title="Edit">
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button onClick={() => deleteProduct(product.id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors" title="Delete">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                                No products found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )
                    }
                </div >
            </main >
        </div >
    );
};

export default AdminDashboard;