import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Search, User, ShoppingBag, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import LoginModal from './LoginModal';

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { cartCount } = useCart();
    const { isAuthenticated, user, openLoginModal } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
            setIsSearchOpen(false);
            setSearchQuery('');
        }
    };

    const topLinks = [
        { label: "About Us", path: "/about" },
        { label: "FAQs", path: "/faqs" },
        { label: "B2B", path: "/b2b" }
    ];

    const mainNavLinks = [
        {
            label: "Handicrafts", path: "/category/handicrafts",
            sub: [
                { label: "Coco Crafts", path: "/category/coco-crafts" },
                { label: "Terracotta Ornaments", path: "/category/terracotta-ornaments" },
                { label: "Banana Fibre Essentials", path: "/category/banana-fibre-essentials" },
                { label: "Handwoven Crochet", path: "/category/handwoven-crochet" }
            ]
        },
        {
            label: "Heritage Mixes", path: "/category/heritage-mixes",
            sub: [
                { label: "Daily Idly Mix", path: "/category/daily-idly-mix" },
                { label: "Tasty Dosa Mix", path: "/category/tasty-dosa-mix" },
                { label: "Wholesome Rice Mix", path: "/category/wholesome-rice-mix" }
            ]
        },
        {
            label: "Instant Nourish", path: "/category/instant-nourish",
            sub: [
                { label: "Shakthimaan", path: "/category/shakthimaan" },
                { label: "Crawl Booster", path: "/category/crawl-booster" },
                { label: "Choco Blast", path: "/category/choco-blast" }
            ]
        },
        {
            label: "Essential Care", path: "/category/essential-care",
            sub: [
                { label: "Heal Soap", path: "/category/heal-soap" },
                { label: "Charcoal Soap", path: "/category/charcoal-soap" },
                { label: "Skin Glow Soap", path: "/category/skin-glow-soap" }
            ]
        },
        {
            label: "Gift Hampers", path: "/category/gift-hampers",
            sub: [
                { label: "Executive Desk Gifts Set", path: "/category/executive-desk-gifts-set" },
                { label: "Wellness & Living Set", path: "/category/wellness-living-set" },
                { label: "Heritage & Culture Gift Set", path: "/category/heritage-culture-gift-set" },
                { label: "Festival & Celebration Gift Set", path: "/category/festival-celebration-gift-set" },
                { label: "Hamper of Love", path: "/category/hamper-of-love" },
                { label: "Anniversary Hamper", path: "/category/anniversary-hamper" }
            ]
        },
        {
            label: "Signature Kits", path: "/category/signature-kits",
            sub: [
                { label: "Happy Journey Kit", path: "/category/happy-journey-kit" },
                { label: "Bachelor Kit", path: "/category/bachelor-kit" },
                { label: "Working Women Kit", path: "/category/working-women-kit" }
            ]
        }
    ];

    // Using the final confirmed logo
    const LOGO_URL = "/uploads/2026/01/kottravai-logo-final.png";

    return (
        // Changed fixed to sticky to naturally push content down, removing the "gap" issue
        <header className={`relative z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>

            {/* Top Utility Bar & Logo Area */}
            <div className="container py-2 md:py-4 flex justify-between items-center border-b border-gray-100">

                {/* Left: Utility Links (hidden on mobile) */}
                <div className="hidden md:flex space-x-6 text-xs md:text-sm text-gray-500 font-medium">
                    {topLinks.map(link => (
                        <Link key={link.label} to={link.path} className="hover:text-primary transition-colors">
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Center: Logo */}
                <div className="flex-1 md:flex-none text-center flex justify-center">
                    <Link to="/">
                        <img
                            src={LOGO_URL}
                            alt="Kottravai"
                            className="h-12 md:h-16 object-contain"
                        />
                    </Link>
                </div>

                {/* Right: Icons */}
                <div className="flex items-center space-x-4 md:space-x-5 text-gray-700">
                    <button
                        className={`hover:text-primary transition-colors ${isSearchOpen ? 'text-primary' : ''}`}
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                    >
                        {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                    </button>
                    <button
                        onClick={() => isAuthenticated ? navigate('/account') : openLoginModal()}
                        className="hidden md:block hover:text-primary transition-colors"
                        title={isAuthenticated ? `Account (${user?.name})` : "Sign In"}
                    >
                        <User size={20} className={isAuthenticated ? "text-[#b5128f]" : ""} />
                    </button>
                    <Link to="/cart" className="relative hover:text-primary transition-colors">
                        <ShoppingBag size={20} />
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                    <button
                        className="md:hidden text-gray-700 ml-2"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Search Bar Overlay */}
            {isSearchOpen && (
                <div className="absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-lg py-6 px-4 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="container max-w-3xl mx-auto">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <input
                                type="text"
                                placeholder="Search for products..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B] transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#8E2A8B] text-white px-6 py-1.5 rounded-full text-sm font-bold hover:bg-[#701a6d] transition-colors"
                            >
                                Search
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Navigation Bar (Desktop) */}
            <div className="hidden md:block bg-[#b5128f]">
                <div className="container">
                    <nav className="flex justify-center space-x-8">
                        {mainNavLinks.map((link) => (
                            <div key={link.label} className="group relative">
                                <NavLink
                                    to={link.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-1 text-[13px] uppercase tracking-wider font-semibold transition-colors py-4 px-2 border-b-2 border-transparent hover:text-white/90 ${isActive ? 'text-white border-white' : 'text-white'
                                        }`
                                    }
                                >
                                    {link.label}
                                    {link.sub && <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />}
                                </NavLink>

                                {/* Dropdown Menu */}
                                {link.sub && (
                                    <div className="absolute top-full left-0 bg-white shadow-xl rounded-b-lg py-4 min-w-[250px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50 border-t-2 border-[#b5128f]">
                                        <div className="flex flex-col">
                                            {link.sub.map((subLink) => (
                                                <Link
                                                    key={subLink.label}
                                                    to={subLink.path}
                                                    className="px-6 py-3 text-[14px] text-gray-700 hover:bg-[#F8F0FF] hover:text-[#b5128f] hover:font-bold transition-colors font-medium text-left"
                                                >
                                                    {subLink.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-white border-t p-4 absolute top-full left-0 w-full shadow-lg h-screen overflow-y-auto pb-20">
                    <nav className="flex flex-col space-y-4">
                        {mainNavLinks.map((link) => (
                            <NavLink
                                key={link.label}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2"
                            >
                                {link.label}
                            </NavLink>
                        ))}
                        <div className="pt-6 border-t border-gray-100 space-y-4">
                            {!isAuthenticated ? (
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        openLoginModal();
                                    }}
                                    className="w-full py-4 bg-black text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-black/10 active:scale-95 transition-all text-sm"
                                >
                                    Sign In
                                </button>
                            ) : (
                                <Link
                                    to="/account"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl text-gray-900 font-bold"
                                >
                                    <User size={20} className="text-[#b5128f]" />
                                    <span>My Account</span>
                                </Link>
                            )}
                        </div>
                    </nav>
                </div>
            )}
            {/* Login Modal */}
            <LoginModal />
        </header>
    );
};

export default Header;
