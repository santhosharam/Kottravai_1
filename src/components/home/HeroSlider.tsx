import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const HeroSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    // Track previous index to determine slide direction logic if needed, 
    // but effectively we just need to know which is active.

    const slides = [
        {
            id: 1,
            image: "https://kottravai.in/wp-content/uploads/2025/12/WhatsApp-Image-2025-12-30-at-4.20.58-PM-e1767163041511.jpeg",
            link: "/shop"
        },
        {
            id: 2,
            image: "https://kottravai.in/wp-content/uploads/2025/12/WhatsApp-Image-2025-12-31-at-10.16.33-AM-e1767163411201.jpeg",
            link: "/shop"
        }
    ];

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, [slides.length]);

    useEffect(() => {
        const interval = setInterval(nextSlide, 4000);
        return () => clearInterval(interval);
    }, [nextSlide]);

    return (
        <section className="relative w-full bg-[#f5f5f5] overflow-hidden hero-banner-section">
            <style>{`
                /* Custom styles to match specific requirements */
                .hero-banner-section {
                    height: 600px;
                }
                @media (max-width: 768px) {
                    .hero-banner-section {
                        height: auto;
                        aspect-ratio: 3/2;
                        max-height: 500px;
                    }
                }
                .banner-slide {
                    transition: transform 0.8s ease-in-out;
                }
                @media (max-width: 768px) {
                    .banner-slide img {
                        object-fit: contain !important; /* Force contain on mobile as requested */
                        background-color: #f9f9f9;
                    }
                }
            `}</style>

            <div className="relative w-full h-full">
                {slides.map((slide, index) => {
                    // Determine position based on current index
                    let positionClass = 'translate-x-full z-10'; // Default right

                    if (index === currentIndex) {
                        positionClass = 'translate-x-0 z-20'; // Active center
                    } else if (
                        index === (currentIndex - 1 + slides.length) % slides.length
                    ) {
                        // Previous slide goes to left
                        positionClass = '-translate-x-full z-10';
                    }

                    return (
                        <div
                            key={slide.id}
                            className={`absolute top-0 left-0 w-full h-full flex banner-slide bg-white ${positionClass}`}
                        >
                            <Link to={slide.link} className="block w-full h-full relative cursor-pointer">
                                <img
                                    src={slide.image}
                                    alt={`Banner ${slide.id}`}
                                    className="absolute top-0 left-0 w-full h-full object-cover object-center md:object-cover sm:object-contain"
                                />
                                {/* Mobile optimization: ensure image contains fully on small screens if needed, 
                                    but user CSS said object-fit: contain for mobile. 
                                    Let's apply that via inline styles or Tailwind classes based on media query equivalent means 
                                    or just rely on the object-cover which usually looks good, 
                                    but user specifically asked for 'object-fit: contain' on mobile.
                                */}

                            </Link>
                        </div>
                    );
                })}
            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-[30px] left-1/2 -translate-x-1/2 z-30 flex gap-3">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-3 h-3 rounded-full border border-white/10 transition-all duration-300 ${index === currentIndex
                            ? 'bg-white scale-125'
                            : 'bg-white/40 hover:bg-white/70'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default HeroSlider;
