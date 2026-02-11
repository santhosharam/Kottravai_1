import { Helmet } from 'react-helmet-async';
import MainLayout from '@/layouts/MainLayout';
import HeroSlider from '@/components/home/HeroSlider';
import BestSellers from '@/components/home/BestSellers';

import JournalSection from '@/components/home/JournalSection';
import TrustedPartners from '@/components/home/TrustedPartners';
import VideoGallery from '@/components/home/VideoGallery';
import Testimonials from '@/components/home/Testimonials';
import ValueProps from '@/components/home/ValueProps';

const Home = () => {
    return (
        <MainLayout>
            <Helmet>
                <title>Kottravai - Handicrafts Excellence & Heritage Mixes</title>
                <meta name="description" content="Kottravai offers premium handcrafted terracotta jewellery, heritage mixes, and essential care products. Shop our exclusive collection today." />
            </Helmet>

            {/* 1. Hero Section */}
            <HeroSlider />

            {/* 2. Value Props / Trust Indicators - Placing high up like typical e-com */}
            {/* (Live site might have it lower, but good for UX here, or move to bottom) */}

            {/* 3. Best Sellers */}
            <BestSellers />

            {/* 4. Gift Hampers / Collections */}


            {/* 5. The Kottravai Journal */}
            <JournalSection />

            {/* 6. Trusted By */}
            <TrustedPartners />

            {/* 7. Video Gallery */}
            <VideoGallery />

            {/* 8. Testimonials */}
            <Testimonials />

            {/* 9. Bottom Value Props */}
            <ValueProps />

        </MainLayout>
    );
};

export default Home;
