import { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { useLocation } from 'react-router-dom';

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
    const location = useLocation();
    const isHome = location.pathname === '/';
    const isB2B = location.pathname === '/b2b';

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            {/* Remove padding for Home and B2B to allow full-width banners */}
            <main className={`flex-grow ${isHome || isB2B ? '' : 'pt-4'}`}>
                {children}
            </main>
            <Footer />
            <WhatsAppButton />
        </div>
    );
};

export default MainLayout;
