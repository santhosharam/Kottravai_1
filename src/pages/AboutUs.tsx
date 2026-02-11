import { Heart, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { useState, useEffect } from 'react';

const TeamSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visibleCards, setVisibleCards] = useState(4);
    const totalCards = teamMembers.length;

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) setVisibleCards(1);
            else if (window.innerWidth < 1024) setVisibleCards(2);
            else setVisibleCards(4);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (totalCards > visibleCards) {
                setCurrentIndex((prev) => (prev + 1) % (totalCards - visibleCards + 1));
            }
        }, 6000);
        return () => clearInterval(interval);
    }, [currentIndex, visibleCards, totalCards]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % (totalCards - visibleCards + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + (totalCards - visibleCards + 1)) % (totalCards - visibleCards + 1));
    };

    return (
        <div className="relative max-w-[1200px] mx-auto px-4 md:px-10">
            <div className="overflow-hidden">
                <div
                    className="flex transition-transform duration-[1000ms] ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * (100 / visibleCards)}%)` }}
                >
                    {teamMembers.map((member, idx) => (
                        <div
                            key={`${member.name}-${idx}`}
                            className="flex-shrink-0 px-4 text-center group"
                            style={{ width: `${100 / visibleCards}%` }}
                        >
                            <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 mx-auto rounded-full overflow-hidden border-4 border-transparent group-hover:border-[#EACCF2] transition-all duration-300 mb-4 sm:mb-6 shadow-sm group-hover:shadow-md">
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-full h-full object-cover object-top transform transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>
                            <div className="px-1">
                                <h4 className="font-bold text-[#2D1B4E] text-base sm:text-lg mb-1 sm:mb-2">{member.name}</h4>
                                <p className="text-gray-500 text-xs sm:text-sm font-medium tracking-wide">{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons - Hidden if all visible */}
            {totalCards > visibleCards && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute top-1/2 -left-2 md:left-0 transform -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white shadow-lg text-[#2D1B4E] hover:bg-[#2D1B4E] hover:text-white transition-all z-10 border border-gray-100"
                    >
                        <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute top-1/2 -right-2 md:right-0 transform -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white shadow-lg text-[#2D1B4E] hover:bg-[#2D1B4E] hover:text-white transition-all z-10 border border-gray-100"
                    >
                        <ChevronRight size={20} className="sm:w-6 sm:h-6" />
                    </button>
                </>
            )}
        </div>
    );
};



const AboutUs = () => {
    return (
        <MainLayout>
            <div className="bg-white">
                {/* About Intro Section */}
                <section className="relative py-16 md:py-24 bg-white overflow-hidden">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                            {/* Left Content */}
                            <div className="space-y-8 pr-0 md:pr-8">
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#2D1B4E] leading-[1.1] tracking-tight">
                                    We build dignified livelihoods<br className="hidden lg:block" /> through craft.
                                </h2>

                                <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                                    Kottravai is a women-led platform creating eco-friendly handmade products
                                    while enabling rural women artisans to earn sustainable, independent incomes.
                                    We believe economic dignity strengthens families, preserves traditions,
                                    and builds resilient communities.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 pt-8">
                                    <div className="border-l-[5px] border-[#8E2A8B] pl-6 py-1 flex flex-col justify-center">
                                        <strong className="text-[#2D1B4E] font-bold text-lg mb-1.5 leading-none">Women-Led</strong>
                                        <span className="text-gray-500 text-[15px] leading-tight">Built by women, for women</span>
                                    </div>
                                    <div className="border-l-[5px] border-[#8E2A8B] pl-6 py-1 flex flex-col justify-center">
                                        <strong className="text-[#2D1B4E] font-bold text-lg mb-1.5 leading-none">Handcrafted</strong>
                                        <span className="text-gray-500 text-[15px] leading-tight">Rooted in artisan skill</span>
                                    </div>
                                    <div className="border-l-[5px] border-[#8E2A8B] pl-6 py-1 flex flex-col justify-center">
                                        <strong className="text-[#2D1B4E] font-bold text-lg mb-1.5 leading-none">Sustainable</strong>
                                        <span className="text-gray-500 text-[15px] leading-tight">Designed with natural materials</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Visual */}
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                                <img
                                    src="https://kottravai.in/wp-content/uploads/2025/11/DSC03396-1.jpg"
                                    alt="Kottravai women artisans"
                                    className="w-full h-auto object-cover"
                                    loading="lazy"
                                />
                            </div>
                        </div>

                        {/* Impact Strip - Dark Themed */}
                        <div className="bg-[#2D1B4E] rounded-2xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row justify-around items-center gap-8 text-center max-w-5xl mx-auto transform translate-y-4">
                            <div className="flex flex-col items-center group">
                                <strong className="text-4xl md:text-5xl font-bold text-[#FFD700] mb-2 group-hover:scale-110 transition-transform duration-300">50+</strong>
                                <span className="text-white font-medium uppercase tracking-wider text-sm">Women Artisans</span>
                            </div>
                            {/* Hidden divider on mobile */}
                            <div className="hidden md:block w-px h-16 bg-white/20"></div>
                            <div className="flex flex-col items-center group">
                                <strong className="text-4xl md:text-5xl font-bold text-[#FFD700] mb-2 group-hover:scale-110 transition-transform duration-300">100%</strong>
                                <span className="text-white font-medium uppercase tracking-wider text-sm">Handmade Products</span>
                            </div>
                            <div className="hidden md:block w-px h-16 bg-white/20"></div>
                            <div className="flex flex-col items-center group">
                                <strong className="text-4xl md:text-5xl font-bold text-[#FFD700] mb-2 group-hover:scale-110 transition-transform duration-300">0%</strong>
                                <span className="text-white font-medium uppercase tracking-wider text-sm">Plastic Materials</span>
                            </div>
                        </div>
                    </div>
                </section>



                {/* Our Impact Section - New Design */}
                <section className="py-10 bg-white">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <h2 className="text-center text-3xl md:text-5xl font-black text-[#2D1B4E] mb-8 leading-tight">
                            Our Impact
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Item 1 */}
                            <div className="text-center p-5 hover:-translate-y-1 transition-transform duration-300 md:flex md:flex-col md:text-center md:items-center sm:text-left sm:flex-row sm:items-start sm:gap-5 group">
                                <div className="w-20 h-20 mx-auto sm:mx-0 md:mx-auto mb-5 flex items-center justify-center bg-[#F8F0FF] rounded-full p-4 shadow-md transition-all duration-300 group-hover:bg-white group-hover:shadow-lg flex-shrink-0">
                                    <img
                                        src="https://kottravai.in/wp-content/uploads/2025/12/empowerment.png"
                                        alt="Women empowered"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Women Empowered</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Rural women transition from hazardous Beedi work into safe, skilled, and dignified livelihoods.
                                    </p>
                                </div>
                            </div>

                            {/* Item 2 */}
                            <div className="text-center p-5 hover:-translate-y-1 transition-transform duration-300 md:flex md:flex-col md:text-center md:items-center sm:text-left sm:flex-row sm:items-start sm:gap-5 group">
                                <div className="w-20 h-20 mx-auto sm:mx-0 md:mx-auto mb-5 flex items-center justify-center bg-[#F8F0FF] rounded-full p-4 shadow-md transition-all duration-300 group-hover:bg-white group-hover:shadow-lg flex-shrink-0">
                                    <img
                                        src="https://kottravai.in/wp-content/uploads/2025/12/dignity.png"
                                        alt="Health and wellbeing"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Health &amp; Wellbeing Restored</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Reduced exposure to toxic environments leads to improved physical health and quality of life.
                                    </p>
                                </div>
                            </div>

                            {/* Item 3 */}
                            <div className="text-center p-5 hover:-translate-y-1 transition-transform duration-300 md:flex md:flex-col md:text-center md:items-center sm:text-left sm:flex-row sm:items-start sm:gap-5 group">
                                <div className="w-20 h-20 mx-auto sm:mx-0 md:mx-auto mb-5 flex items-center justify-center bg-[#F8F0FF] rounded-full p-4 shadow-md transition-all duration-300 group-hover:bg-white group-hover:shadow-lg flex-shrink-0">
                                    <img
                                        src="https://kottravai.in/wp-content/uploads/2025/12/collaborate.png"
                                        alt="Stable income"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Stable Livelihoods Created</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Consistent income and skill development bring long-term financial security to families.
                                    </p>
                                </div>
                            </div>

                            {/* Item 4 */}
                            <div className="text-center p-5 hover:-translate-y-1 transition-transform duration-300 md:flex md:flex-col md:text-center md:items-center sm:text-left sm:flex-row sm:items-start sm:gap-5 group">
                                <div className="w-20 h-20 mx-auto sm:mx-0 md:mx-auto mb-5 flex items-center justify-center bg-[#F8F0FF] rounded-full p-4 shadow-md transition-all duration-300 group-hover:bg-white group-hover:shadow-lg flex-shrink-0">
                                    <img
                                        src="https://kottravai.in/wp-content/uploads/2025/12/ecology.png"
                                        alt="Sustainability"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Sustainable Futures Built</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Eco-friendly materials and ethical production support communities and the planet together.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission & Vision */}
                <section className="py-16 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-black text-[#2D1B4E] mb-4">
                                Heart & Horizon
                            </h2>
                            <p className="max-w-2xl mx-auto text-gray-600">
                                Kottravai exists at the intersection of timeless heritage and ethical progress. We are not just creating products; we are cultivating a movement.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                            {/* Mission */}
                            <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border-t-4 border-[#8B2C84]">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 text-[#8B2C84]">
                                    <Heart size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-[#2D1B4E] mb-4">Our Mission</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    To revive and elevate the ancient craft traditions of India by creating sustainable, dignified livelihoods for rural women artisans. We are committed to a zero-waste philosophy, ensuring that every creation contributes to the healing of our planet while celebrating the unparalleled beauty of human skill.
                                </p>
                            </div>

                            {/* Vision */}
                            <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border-t-4 border-[#2D1B4E]">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-[#2D1B4E]">
                                    <Globe size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-[#2D1B4E] mb-4">Our Vision</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    To be the global beacon of ethical luxury, redefining wealth not as accumulation, but as impact. We envision a world where luxury is synonymous with conscience, where every purchase tells a story of empowerment, and where traditional Indian artistry earns its rightful place on the world stage.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Team Showcase Section */}
                <section className="py-24 bg-white overflow-hidden">
                    <div className="container mx-auto px-4 mb-20">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-5xl font-black text-[#2D1B4E] mb-6">
                                Our Team
                            </h2>
                            <p className="text-lg text-gray-600">
                                Meet the artisans, designers, and visionaries shaping the future of sustainable craft.
                            </p>
                        </div>

                        {/* 3 Main Images - Static */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 text-center">
                            {/* Card 1: Sridhar Vembu */}
                            <div className="space-y-4">
                                <div className="rounded-2xl overflow-hidden h-[400px] shadow-xl group">
                                    <img
                                        src="/team/team-3.jpg"
                                        alt="Sridhar Vembu"
                                        className="w-full h-full object-cover object-top transform transition-transform duration-700 group-hover:scale-110"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#2D1B4E]">Sridhar Vembu</h3>
                                    <p className="text-[#8B2C84] font-medium">Chief Mentor</p>
                                </div>
                            </div>

                            {/* Card 2: Ananthan Ayyasamy */}
                            <div className="space-y-4">
                                <div className="rounded-2xl overflow-hidden h-[400px] shadow-xl group">
                                    <img
                                        src="/team/team-1.jpg"
                                        alt="Ananthan Ayyasamy"
                                        className="w-full h-full object-cover object-top transform transition-transform duration-700 group-hover:scale-110"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#2D1B4E]">Ananthan Ayyasamy</h3>
                                    <p className="text-[#8B2C84] font-medium">Co-Founder</p>
                                </div>
                            </div>

                            {/* Card 3: Karunya Gunavathy */}
                            <div className="space-y-4">
                                <div className="rounded-2xl overflow-hidden h-[400px] shadow-xl group">
                                    <img
                                        src="/team/team-2.jpg"
                                        alt="Karunya Gunavathy"
                                        className="w-full h-full object-cover object-top transform transition-transform duration-700 group-hover:scale-110"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#2D1B4E]">Karunya Gunavathy</h3>
                                    <p className="text-[#8B2C84] font-medium">CEO & Co-Founder</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Team Slider with Arrows */}
                    <div className="container mx-auto px-4">
                        <TeamSlider />
                    </div>
                </section>







                {/* What Makes Kottravai Different Section */}
                <section className="py-[90px] px-5 bg-white">
                    <div className="max-w-[1200px] mx-auto">

                        {/* Header */}
                        <header className="text-center max-w-[720px] mx-auto mb-[70px]">
                            <span className="text-[13px] tracking-[.18em] uppercase text-[#8E2A8B] font-bold block">
                                OUR DIFFERENCE
                            </span>
                            <h2 className="text-[28px] md:text-[38px] font-extrabold text-[#2D1B4E] my-3.5">
                                What Makes Kottravai Different
                            </h2>
                            <p className="text-[#555] text-lg leading-[1.7]">
                                Kottravai stands at the intersection of tradition, sustainability,
                                and women-led craftsmanship — creating products with purpose and impact.
                            </p>
                        </header>

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-auto lg:auto-rows-[260px] gap-[26px]">

                            {/* Large Card - Sustainable by Nature */}
                            <article className="lg:col-span-2 lg:row-span-2 relative p-[26px] flex flex-col bg-white border-[1.8px] border-[#8E2A8B] rounded-[14px] overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-[18px] font-bold text-[#2D1B4E] mb-2">Sustainable by Nature</h3>
                                    <p className="text-[14.8px] leading-[1.65] text-[#555]">
                                        Our products are created using eco-friendly, responsibly sourced
                                        materials that honour nature and reduce environmental impact.<br /><br />
                                        We work with natural, biodegradable, and responsibly sourced materials, ensuring minimal
                                        environmental impact while maintaining durability and timeless appeal.
                                    </p>
                                </div>
                                <div className="w-full h-[200px] lg:h-[260px] mt-auto pt-5">
                                    <img
                                        src="https://kottravai.in/wp-content/uploads/2025/11/DSC03998.jpg"
                                        alt="Sustainable production"
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                </div>
                            </article>

                            {/* Small Card 1 - Women-Led Craftsmanship */}
                            <article className="group relative min-h-[220px] p-[26px] flex flex-col bg-white border-[1.8px] border-[#8E2A8B] rounded-[16px] overflow-hidden transition-all duration-300 hover:shadow-[0_24px_60px_rgba(142,42,139,0.18)] hover:border-transparent">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-450 z-0">
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B4E]/30 to-[#2D1B4E]/90 z-10"></div>
                                    <img src="https://kottravai.in/wp-content/uploads/2025/12/Picture3.png" alt="Women artisans" className="w-full h-full object-cover" />
                                </div>
                                <div className="relative z-20">
                                    <h3 className="text-[18px] font-bold text-[#2D1B4E] mb-2 group-hover:text-white group-hover:drop-shadow-md transition-colors">Women-Led Craftsmanship</h3>
                                    <p className="text-[14.8px] leading-[1.65] text-[#555] group-hover:text-white/95 group-hover:drop-shadow-md transition-colors">
                                        Every Kottravai product is handcrafted by skilled rural women,
                                        ensuring ethical production and dignified livelihoods.
                                    </p>
                                </div>
                            </article>

                            {/* Small Card 2 - Eco-Conscious Creation */}
                            <article className="group relative min-h-[220px] p-[26px] flex flex-col bg-white border-[1.8px] border-[#8E2A8B] rounded-[16px] overflow-hidden transition-all duration-300 hover:shadow-[0_24px_60px_rgba(142,42,139,0.18)] hover:border-transparent">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-450 z-0">
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B4E]/30 to-[#2D1B4E]/90 z-10"></div>
                                    <img src="https://kottravai.in/wp-content/uploads/2025/12/Picture4.png" alt="Eco creation" className="w-full h-full object-cover" />
                                </div>
                                <div className="relative z-20">
                                    <h3 className="text-[18px] font-bold text-[#2D1B4E] mb-2 group-hover:text-white group-hover:drop-shadow-md transition-colors">Eco-Conscious Creation</h3>
                                    <p className="text-[14.8px] leading-[1.65] text-[#555] group-hover:text-white/95 group-hover:drop-shadow-md transition-colors">
                                        We prioritise slow, mindful production that respects resources,
                                        communities, and future generations.
                                    </p>
                                </div>
                            </article>

                            {/* Small Card 3 - Ethical Practices */}
                            <article className="group relative min-h-[220px] p-[26px] flex flex-col bg-white border-[1.8px] border-[#8E2A8B] rounded-[16px] overflow-hidden transition-all duration-300 hover:shadow-[0_24px_60px_rgba(142,42,139,0.18)] hover:border-transparent">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-450 z-0">
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B4E]/30 to-[#2D1B4E]/90 z-10"></div>
                                    <img src="https://kottravai.in/wp-content/uploads/2025/12/Picture2.png" alt="Ethical practices" className="w-full h-full object-cover" />
                                </div>
                                <div className="relative z-20">
                                    <h3 className="text-[18px] font-bold text-[#2D1B4E] mb-2 group-hover:text-white group-hover:drop-shadow-md transition-colors">Ethical Practices</h3>
                                    <p className="text-[14.8px] leading-[1.65] text-[#555] group-hover:text-white/95 group-hover:drop-shadow-md transition-colors">
                                        Fair wages, transparency, and respect guide every partnership
                                        and production decision we make.
                                    </p>
                                </div>
                            </article>

                            {/* Small Card 4 - Purpose-Driven Impact */}
                            <article className="group relative min-h-[220px] p-[26px] flex flex-col bg-white border-[1.8px] border-[#8E2A8B] rounded-[16px] overflow-hidden transition-all duration-300 hover:shadow-[0_24px_60px_rgba(142,42,139,0.18)] hover:border-transparent">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-450 z-0">
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B4E]/30 to-[#2D1B4E]/90 z-10"></div>
                                    <img src="https://kottravai.in/wp-content/uploads/2025/12/Picture5.png" alt="Purpose impact" className="w-full h-full object-cover" />
                                </div>
                                <div className="relative z-20">
                                    <h3 className="text-[18px] font-bold text-[#2D1B4E] mb-2 group-hover:text-white group-hover:drop-shadow-md transition-colors">Purpose-Driven Impact</h3>
                                    <p className="text-[14.8px] leading-[1.65] text-[#555] group-hover:text-white/95 group-hover:drop-shadow-md transition-colors">
                                        Each purchase directly supports women’s independence,
                                        traditional crafts, and conscious living.
                                    </p>
                                </div>
                            </article>

                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="py-20 px-4 bg-white overflow-hidden">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
                        {/* Left Content */}
                        <div className="text-center md:text-left">
                            <span className="inline-block text-sm font-bold uppercase tracking-[2px] text-[#8E2A8B] mb-5 bg-[#F8F0FF] px-4 py-2 rounded-full">
                                OUR COMMITMENT
                            </span>

                            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6 text-[#2D1B4E]">
                                Join the Kottravai Movement
                            </h2>

                            <p className="text-lg leading-relaxed mb-10 text-gray-600 max-w-lg mx-auto md:mx-0">
                                Every purchase is more than a transaction—it’s a contribution to change.
                                Support women. Preserve tradition. Choose sustainability.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start">
                                <a
                                    className="inline-block px-8 py-4 rounded-lg font-semibold text-center transition-all duration-300 bg-[#8E2A8B] text-white shadow-[0_4px_15px_rgba(142,42,139,0.3)] hover:bg-[#6d1e6a] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(142,42,139,0.4)]"
                                    href="https://kottravai.in/product-category/handicrafts/"
                                >
                                    Explore Our Handcrafted Collections
                                </a>
                                <a
                                    className="inline-block px-8 py-4 rounded-lg font-semibold text-center transition-all duration-300 bg-transparent text-[#8E2A8B] border border-[#8E2A8B] hover:bg-[#F8F0FF] hover:text-[#6d1e6a] hover:border-[#6d1e6a]"
                                    href="https://kottravai.in/b2b/"
                                >
                                    Get in Touch With Us
                                </a>
                            </div>
                        </div>

                        {/* Right Visual */}
                        <div className="relative h-[350px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src="https://kottravai.in/wp-content/uploads/2025/12/DSC03611-scaled.jpg"
                                alt="Kottravai artisans and craftsmanship"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </MainLayout >
    );
};





const teamMembers = [
    {
        name: "Ahamed Musharaf Ali",
        role: "Product Manager",
        image: "/team/member-3.jpg"
    },
    {
        name: "Santhosh",
        role: "Developer",
        image: "/team/member-1.jpg"
    },
    {
        name: "Mohammed Safeek",
        role: "Sales Head",
        image: "/team/member-2.jpg"
    },
    {
        name: "Gnana Jency",
        role: "Hub Manager",
        image: "/team/gnana_jency.jpg"
    },
    {
        name: "Shunmuga Priya",
        role: "Production Manager",
        image: "/team/member-5.jpg"
    },
    {
        name: "Jayanthi",
        role: "QC Head",
        image: "/team/member-4.jpg"
    },
    {
        name: "Fatima Ahmed",
        role: "Quality Control",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400"
    }
];

export default AboutUs;
