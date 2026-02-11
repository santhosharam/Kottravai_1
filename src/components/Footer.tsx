import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Youtube, ArrowRight, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

const Footer = () => {
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const checkScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', checkScroll);
        return () => window.removeEventListener('scroll', checkScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-black text-white pt-20 pb-10 relative">
            <div className="mx-auto max-w-[1440px] px-6 sm:px-8 md:px-12 lg:px-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                {/* Col 1: Brand & Address */}
                <div className="space-y-6">
                    <Link to="/" className="inline-block">
                        <div className="text-2xl font-bold tracking-wider">
                            <span className="text-[#d846ef]">kottrav</span>
                            <span className="text-[#a21caf]">ai</span>
                        </div>
                    </Link>
                    <div className="text-gray-400 text-sm space-y-2 leading-relaxed">
                        <p>
                            Vazhai Incubator<br />
                            S Veerachamy Chettiar college,<br />
                            Puliyangudi - 627855
                        </p>
                        <p className="pt-2">
                            Phone: <a href="tel:+919787030811" className="hover:text-[#d846ef] transition-colors">+91 97870 30811</a>
                        </p>
                    </div>
                </div>

                {/* Col 2: Main Navigation */}
                <div>
                    <h4 className="text-lg font-bold mb-8">Main Navigation</h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li><Link to="/" className="hover:text-[#d846ef] transition-colors">Home</Link></li>
                        <li><Link to="/shop" className="hover:text-[#d846ef] transition-colors">Shop By Category</Link></li>
                        <li><Link to="/about" className="hover:text-[#d846ef] transition-colors">Our Story</Link></li>
                        <li><Link to="/contact" className="hover:text-[#d846ef] transition-colors">Contact</Link></li>
                        <li><Link to="/blogs" className="hover:text-[#d846ef] transition-colors">Blogs</Link></li>
                    </ul>
                </div>

                {/* Col 3: Useful Links */}
                <div>
                    <h4 className="text-lg font-bold mb-8">Useful Links</h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li><Link to="/shipping-policy" className="hover:text-[#d846ef] transition-colors">Shipping Policy</Link></li>
                        <li><Link to="/refund-policy" className="hover:text-[#d846ef] transition-colors">Refund Policy</Link></li>
                        <li><Link to="/terms-of-service" className="hover:text-[#d846ef] transition-colors">Terms Of Service</Link></li>
                        <li><Link to="/privacy-policy" className="hover:text-[#d846ef] transition-colors">Privacy Policy</Link></li>
                        <li><Link to="/sitemap" className="hover:text-[#d846ef] transition-colors">Sitemap</Link></li>
                    </ul>
                </div>

                {/* Col 4: Let's get in touch */}
                <div>
                    <h4 className="text-lg font-bold mb-6">Let's get in touch</h4>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        Sign up to get first dibs on new arrivals, sales, exclusive content, events and more!
                    </p>
                    <form className="relative mb-8">
                        <input
                            type="email"
                            placeholder="Enter your email..."
                            className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg pl-4 pr-12 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#d846ef] transition-colors"
                        />
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-[#d846ef] hover:text-white transition-all text-black">
                            <ArrowRight size={16} />
                        </button>
                    </form>

                    {/* Social Icons */}
                    <div className="flex space-x-6">
                        <a href="https://www.facebook.com/profile.php?id=61582600756315" className="bg-white rounded-full p-1.5 text-black hover:bg-[#d846ef] hover:text-white transition-colors"><Facebook size={18} /></a>
                        <a href="https://www.youtube.com/@Kottravai_in" className="bg-white rounded-full p-1.5 text-black hover:bg-[#d846ef] hover:text-white transition-colors"><Youtube size={18} /></a>
                        <a href="https://x.com/kottravai_in" className="bg-white rounded-full p-1.5 text-black hover:bg-[#d846ef] hover:text-white transition-colors">
                            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>
                        <a href="https://www.instagram.com/kottravai_in/" className="bg-white rounded-full p-1.5 text-black hover:bg-[#d846ef] hover:text-white transition-colors"><Instagram size={18} /></a>
                        <a href="https://in.linkedin.com/company/kottravai" className="bg-white rounded-full p-1.5 text-black hover:bg-[#d846ef] hover:text-white transition-colors"><Linkedin size={18} /></a>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="mx-auto max-w-[1440px] px-8 md:px-12 lg:px-20 pt-8 text-sm text-gray-400">
                <p>© 2025 – Kottravai. All Rights Reserved.</p>
            </div>

            {/* Scroll To Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-[176px] right-8 w-11 h-11 border border-gray-200 rounded-full flex items-center justify-center hover:bg-black hover:border-black text-black hover:text-white transition-all z-50 bg-white shadow-xl"
                    aria-label="Scroll to top"
                >
                    <ChevronUp size={20} />
                </button>
            )}
        </footer>
    );
};

export default Footer;
