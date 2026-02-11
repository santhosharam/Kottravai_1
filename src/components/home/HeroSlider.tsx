import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';

const SLIDES = [
    {
        id: 1,
        image: "https://kottravai.in/wp-content/uploads/2025/12/WhatsApp-Image-2025-12-30-at-4.20.58-PM-e1767163041511.jpeg",
        link: "#"
    },
    {
        id: 2,
        image: "https://kottravai.in/wp-content/uploads/2025/12/WhatsApp-Image-2025-12-31-at-10.16.33-AM-e1767163411201.jpeg",
        link: "#"
    }
];

const HeroSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Refs to access state inside intervals/timeouts without stale closures
    const currentIndexRef = useRef(0);
    const isAnimatingRef = useRef(false);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Sync refs with state
    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    useEffect(() => {
        isAnimatingRef.current = isAnimating;
    }, [isAnimating]);

    // Initialize slides and start autoplay
    useEffect(() => {
        // Set initial positions
        slideRefs.current.forEach((slide, index) => {
            if (slide) {
                // Ensure base styles
                slide.style.transition = 'transform 0.8s ease-in-out';
                slide.style.display = 'flex'; // Ensure flex from CSS is kept

                if (index === 0) {
                    slide.classList.add('active');
                    slide.style.transform = 'translateX(0)';
                    slide.style.zIndex = '2';
                } else {
                    slide.classList.remove('active');
                    slide.style.transform = 'translateX(100%)';
                    slide.style.zIndex = '1';
                }
            }
        });

        startInterval();

        return () => stopInterval();
    }, []);

    const startInterval = () => {
        stopInterval();
        intervalRef.current = setInterval(() => {
            handleNext();
        }, 4000);
    };

    const stopInterval = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const resetInterval = () => {
        stopInterval();
        startInterval();
    };

    const showSlide = (index: number, direction: 'next' | 'prev') => {
        if (isAnimatingRef.current) return;

        const currentIdx = currentIndexRef.current;
        if (index === currentIdx) return;

        setIsAnimating(true);

        const currentSlide = slideRefs.current[currentIdx];
        const nextSlide = slideRefs.current[index];

        if (!currentSlide || !nextSlide) {
            setIsAnimating(false);
            return;
        }

        // Remove transition momentarily to position the next slide
        nextSlide.style.transition = 'none';
        currentSlide.style.transition = 'transform 0.8s ease-in-out';

        if (direction === 'next') {
            // Prepare next slide on Right
            nextSlide.style.transform = 'translateX(100%)';
            nextSlide.style.zIndex = '2';
            currentSlide.style.zIndex = '1';

            // Force reflow
            void nextSlide.offsetWidth;
            nextSlide.style.transition = 'transform 0.8s ease-in-out';

            // Animate
            requestAnimationFrame(() => {
                if (currentSlide) currentSlide.style.transform = 'translateX(-100%)';
                if (nextSlide) nextSlide.style.transform = 'translateX(0)';
            });
        } else {
            // Prev
            // Prepare next slide on Left
            nextSlide.style.transform = 'translateX(-100%)';
            nextSlide.style.zIndex = '2';
            currentSlide.style.zIndex = '1';

            // Force reflow
            void nextSlide.offsetWidth;
            nextSlide.style.transition = 'transform 0.8s ease-in-out';

            // Animate
            requestAnimationFrame(() => {
                if (currentSlide) currentSlide.style.transform = 'translateX(100%)';
                if (nextSlide) nextSlide.style.transform = 'translateX(0)';
            });
        }

        // Update state after animation
        setTimeout(() => {
            if (currentSlide) {
                currentSlide.classList.remove('active');
                // Reset styling for the inactive slide to ensure it stays invisible/formatted correctly
                // currentSlide.style.transform = 'translateX(100%)'; // Optional cleanup, but keeping it where it landed is generally fine until next usage
            }
            if (nextSlide) {
                nextSlide.classList.add('active');
            }
            setCurrentIndex(index);
            setIsAnimating(false);
        }, 800);
    };

    const handleNext = () => {
        const current = currentIndexRef.current;
        const nextIndex = (current + 1) >= SLIDES.length ? 0 : current + 1;
        showSlide(nextIndex, 'next');
    };

    const handleDotClick = (index: number) => {
        const current = currentIndexRef.current;
        if (index === current || isAnimatingRef.current) return;

        const dir = index > current ? 'next' : 'prev';
        showSlide(index, dir);
        resetInterval();
    };

    return (
        <>
            <Helmet>
                <link
                    href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Raleway:wght@300;400;500&display=swap"
                    rel="stylesheet"
                />
            </Helmet>

            <style>{`
                /* Scoped Styles for Kottravai Banner */
                .kottravai-banner {
                    position: relative;
                    width: 100%;
                    height: 600px;
                    overflow: hidden;
                    font-family: 'Raleway', sans-serif;
                    background-color: #f5f5f5;
                }

                .kottravai-banner * {
                    box-sizing: border-box;
                }

                /* Slide wrapper */
                .kottravai-banner .banner-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }

                /* Individual Slide */
                .kottravai-banner .banner-slide {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    z-index: 1;
                    /* Transition handled via JS inline styles mostly */
                    transition: transform 0.8s ease-in-out;
                }

                .kottravai-banner .banner-slide.active {
                    z-index: 2;
                }

                /* Clickable Area */
                .kottravai-banner .banner-link {
                    display: block;
                    width: 100%;
                    height: 100%;
                    text-decoration: none;
                    color: inherit;
                    position: relative;
                }

                /* Background Image */
                .kottravai-banner .banner-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                }

                /* Dot Navigation */
                .kottravai-banner .banner-nav {
                    position: absolute;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 10;
                    display: flex;
                    gap: 12px;
                }

                .kottravai-banner .banner-dot {
                    width: 12px;
                    height: 12px;
                    background-color: rgba(255, 255, 255, 0.4);
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .kottravai-banner .banner-dot:hover {
                    background-color: rgba(255, 255, 255, 0.7);
                }

                .kottravai-banner .banner-dot.active {
                    background-color: #FFFFFF;
                    transform: scale(1.2);
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .kottravai-banner {
                        height: auto;
                        aspect-ratio: 3/2;
                        max-height: 500px;
                    }

                    .kottravai-banner .banner-bg {
                        object-fit: contain;
                        background-color: #f9f9f9;
                    }
                }
            `}</style>

            <section className="kottravai-banner">
                <div className="banner-container">
                    {SLIDES.map((slide, index) => (
                        <div
                            key={slide.id}
                            className={`banner-slide`}
                            ref={(el) => (slideRefs.current[index] = el)}
                        >
                            <a href={slide.link} className="banner-link">
                                <img
                                    src={slide.image}
                                    alt={`Banner ${index + 1}`}
                                    className="banner-bg"
                                />
                            </a>
                        </div>
                    ))}
                </div>

                <div className="banner-nav">
                    {SLIDES.map((_, index) => (
                        <div
                            key={index}
                            className={`banner-dot ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => handleDotClick(index)}
                        ></div>
                    ))}
                </div>
            </section>
        </>
    );
};

export default HeroSlider;
