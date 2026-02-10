import { useState, useEffect } from 'react';
import { heroSlides } from '@/data/homeData';

const HeroSlider = () => {
    const [current, setCurrent] = useState(0);

    // Auto-scroll functionality
    useEffect(() => {
        if (heroSlides.length <= 1) return; // Don't scroll if only 1 slide
        const interval = setInterval(() => {
            setCurrent(prev => (prev === heroSlides.length - 1 ? 0 : prev + 1));
        }, 6000); // 6 seconds for better readability
        return () => clearInterval(interval);
    }, []);

    const nextSlide = () => {
        if (heroSlides.length <= 1) return;
        setCurrent(current === heroSlides.length - 1 ? 0 : current + 1);
    };

    const prevSlide = () => {
        if (heroSlides.length <= 1) return;
        setCurrent(current === 0 ? heroSlides.length - 1 : current - 1);
    };

    if (!heroSlides.length) return null;

    return (
        <section className="relative w-full overflow-hidden bg-[#faf7f2]">
            {/* Reduced height as requested */}
            <div className="relative w-full h-[50vh] md:h-[450px] lg:h-[550px]">
                {heroSlides.map((slide, index) => {
                    let positionClass = 'translate-x-full opacity-0 z-0'; // Default: Parked right

                    const isCurrent = index === current;
                    const isPrev = index === (current === 0 ? heroSlides.length - 1 : current - 1);
                    const isNext = index === (current === heroSlides.length - 1 ? 0 : current + 1);

                    // If simple fade or 1 slide, force active
                    if (heroSlides.length === 1) {
                        positionClass = 'translate-x-0 opacity-100 z-20';
                    } else {
                        if (isCurrent) {
                            positionClass = 'translate-x-0 opacity-100 z-20';
                        } else if (isPrev) {
                            positionClass = '-translate-x-full opacity-100 z-10';
                        } else if (isNext) {
                            positionClass = 'translate-x-full opacity-100 z-10';
                        }
                    }

                    return (
                        <div
                            key={slide.id}
                            className={`absolute inset-0 w-full h-full transition-transform duration-700 ease-in-out ${positionClass}`}
                        >
                            {/* Background Image - Anchored to TOP to show logo */}
                            <div className={`absolute inset-0 w-full h-full transform transition-transform duration-[8000ms] ease-out ${isCurrent ? 'scale-105' : 'scale-100'}`}>
                                <img
                                    src={slide.image}
                                    alt={slide.title}
                                    className="w-full h-full object-cover object-top"
                                    loading={index === 0 ? "eager" : "lazy"}
                                />
                            </div>

                            {/* Gradient Overlay - subtle for white bg */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/40"></div>

                            {/* Content Container - Aligned Right with Top Padding/Margin to clear logo */}
                            <div className="absolute inset-0 flex items-center md:items-start justify-center md:justify-end">
                                <div className="container mx-auto px-6 md:px-12 flex justify-center md:justify-end">
                                    <div className={`max-w-xl text-center md:text-right transform transition-all duration-700 delay-300 mt-16 sm:mt-24 md:mt-32 lg:mt-40 ${isCurrent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                                        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-[#2D1B4E] mb-2 md:mb-4 leading-[1.2] md:leading-[1.1] tracking-tight drop-shadow-sm">
                                            {slide.title}
                                        </h1>
                                        <p className="text-sm sm:text-base md:text-xl text-gray-700 mb-6 md:mb-8 font-medium leading-relaxed drop-shadow-sm max-w-sm mx-auto md:max-w-none md:ml-auto">
                                            {slide.subtitle}
                                        </p>

                                        <div className="flex flex-wrap gap-4 justify-center md:justify-end">
                                            <a
                                                href={slide.link}
                                                className="px-6 py-2.5 md:px-8 md:py-3 bg-[#b5128f] text-white font-bold rounded-full hover:bg-[#920e73] transition-all transform hover:-translate-y-1 hover:shadow-xl shadow-lg flex items-center justify-center min-w-[120px] md:min-w-[150px] text-sm md:text-base"
                                            >
                                                {slide.cta}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Navigation Dots - Hide if only 1 slide */}
            {heroSlides.length > 1 && (
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-30 flex space-x-3">
                    {heroSlides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrent(index)}
                            className={`transition-all duration-300 rounded-full shadow-lg ${index === current ? 'bg-[#b5128f] w-10 h-3' : 'bg-white/50 w-3 h-3 hover:bg-white'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Navigation Arrows - Hide if only 1 slide */}
            {heroSlides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute top-1/2 left-4 md:left-8 z-30 transform -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-[#b5128f] text-white backdrop-blur-sm border border-white/10 transition-all shadow-lg hover:shadow-[#b5128f]/50 group hidden md:block"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute top-1/2 right-4 md:right-8 z-30 transform -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-[#b5128f] text-white backdrop-blur-sm border border-white/10 transition-all shadow-lg hover:shadow-[#b5128f]/50 group hidden md:block"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </>
            )}
        </section>
    );
};

export default HeroSlider;
