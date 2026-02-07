import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import PageViewer from '@/pages/PageViewer';
import BlogList from '@/pages/BlogList';
import BlogDetail from '@/pages/BlogDetail';
import Contact from '@/pages/Contact';
import NotFound from '@/pages/NotFound';
import AboutUs from '@/pages/AboutUs';
import FAQ from '@/pages/FAQ';
import B2B from '@/pages/B2B';
import Shop from '@/pages/Shop';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import ProductDetails from '@/pages/ProductDetails';
import Account from '@/pages/Account';
import AdminDashboard from '@/pages/admin/AdminDashboard';

import ScrollToTop from '@/components/ScrollToTop';

function App() {
    return (
        <>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:slug" element={<ProductDetails />} />
                <Route path="/category/:slug" element={<Shop />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/account" element={<Account />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/b2b" element={<B2B />} />
                <Route path="/faqs" element={<FAQ />} />
                <Route path="/services" element={<PageViewer slugUri="services" />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy-policy" element={<PageViewer slugUri="privacy-policy" />} />

                {/* Blog System */}
                <Route path="/blog" element={<BlogList />} />
                <Route path="/blog/:slug" element={<BlogDetail />} />

                {/* Dynamic Page Fallback */}
                <Route path="/:slug" element={<PageViewer />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
                {/* Admin Panel */}
                <Route path="/admin" element={<AdminDashboard />} />

            </Routes>
        </>
    );
}

export default App;
