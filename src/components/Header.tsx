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

    // State for mobile sub-menu toggles
    const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(null);

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

    const toggleMobileSubMenu = (label: string) => {
        setExpandedMobileMenu(expandedMobileMenu === label ? null : label);
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
            label: "Instant Nourish", path: "/category/instant-nourish"
        },
        {
            label: "Essential Care", path: "/category/essential-care"
        },
        {
            label: "Signature Kits", path: "/category/signature-kits"
        }
    ];

    const LOGO_URL = "/uploads/2026/01/kottravai-logo-final.png";

    return (
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
                            className="h-10 md:h-16 object-contain"
                        />
                    </Link>
                </div>

                {/* Right: Icons */}
                <div className="flex items-center space-x-3 md:space-x-5 text-gray-700">
                    <button
                        className={`hover:text-primary transition-colors ${isSearchOpen ? 'text-primary' : ''}`}
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                    >
                        {isSearchOpen ? <X size={18} className="md:w-[20px] md:h-[20px]" /> : <Search size={18} className="md:w-[20px] md:h-[20px]" />}
                    </button>
                    <button
                        onClick={() => isAuthenticated ? navigate('/account') : openLoginModal()}
                        className="hidden md:block hover:text-primary transition-colors"
                        title={isAuthenticated ? `Account (${user?.fullName})` : "Sign In"}
                    >
                        <User size={20} className={isAuthenticated ? "text-[#b5128f]" : ""} />
                    </button>
                    <Link to="/cart" className="relative hover:text-primary transition-colors">
                        <ShoppingBag size={18} className="md:w-[20px] md:h-[20px]" />
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                    <button
                        className="md:hidden text-gray-700 p-1"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Search Bar Overlay */}
            {isSearchOpen && (
                <div className="absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-lg py-4 md:py-6 px-4 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="container max-w-3xl mx-auto">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <input
                                type="text"
                                placeholder="Search for products..."
                                className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8E2A8B]/20 focus:border-[#8E2A8B] transition-all text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            <Search className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <button
                                type="submit"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#8E2A8B] text-white px-4 md:px-6 py-1.5 rounded-full text-xs md:text-sm font-bold hover:bg-[#701a6d] transition-colors"
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

            {/* Mobile Menu Slide-in Drawer */}
            <div
                className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsOpen(false)}
            >
                <div
                    className={`absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-[0%]' : 'translate-x-[-100%]'
                        }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col h-full uppercase">
                        {/* Header of drawer */}
                        <div className="p-4 border-b flex justify-between items-center bg-[#b5128f]">
                            <img src={LOGO_URL} alt="Logo" className="h-8 brightness-0 invert" />
                            <button onClick={() => setIsOpen(false)} className="text-white p-1">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex-1 overflow-y-auto p-4 pb-20">
                            <nav className="flex flex-col space-y-1">
                                {mainNavLinks.map((link) => (
                                    <div key={link.label} className="border-b border-gray-50 last:border-0">
                                        <div className="flex items-center justify-between py-3">
                                            <NavLink
                                                to={link.path}
                                                onClick={() => setIsOpen(false)}
                                                className="text-[14px] font-bold text-gray-800 tracking-wide"
                                            >
                                                {link.label}
                                            </NavLink>
                                            {link.sub && (
                                                <button
                                                    onClick={() => toggleMobileSubMenu(link.label)}
                                                    className={`p-2 transition-transform duration-300 ${expandedMobileMenu === link.label ? 'rotate-180' : ''
                                                        }`}
                                                >
                                                    <ChevronDown size={18} className="text-gray-400" />
                                                </button>
                                            )}
                                        </div>

                                        {link.sub && (
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedMobileMenu === link.label
                                                    ? 'max-h-[500px] opacity-100 pb-4'
                                                    : 'max-h-0 opacity-0'
                                                    }`}
                                            >
                                                <div className="flex flex-col space-y-1 pl-4 border-l-2 border-[#b5128f]/20 ml-1">
                                                    {link.sub.map((subLink) => (
                                                        <Link
                                                            key={subLink.label}
                                                            to={subLink.path}
                                                            onClick={() => setIsOpen(false)}
                                                            className="py-2 text-[13px] text-gray-600 hover:text-[#b5128f] transition-colors"
                                                        >
                                                            {subLink.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Utility Links in Mobile Menu */}
                                <div className="pt-6 mt-6 border-t border-gray-100 space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        {topLinks.map(link => (
                                            <Link
                                                key={link.label}
                                                to={link.path}
                                                onClick={() => setIsOpen(false)}
                                                className="py-2 px-3 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-600 text-center"
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>

                                    {!isAuthenticated ? (
                                        <button
                                            onClick={() => {
                                                setIsOpen(false);
                                                openLoginModal();
                                            }}
                                            className="w-full py-3 bg-[#b5128f] text-white font-bold uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all text-xs"
                                        >
                                            Sign In / Register
                                        </button>
                                    ) : (
                                        <Link
                                            to="/account"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center justify-center gap-3 p-3 bg-[#b5128f]/10 rounded-xl text-[#b5128f] font-bold text-xs"
                                        >
                                            <User size={18} />
                                            <span>My Account ({user?.fullName})</span>
                                        </Link>
                                    )}
                                </div>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            <LoginModal />
        </header>
    );
};

export default Header;
