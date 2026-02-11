import { features } from '@/data/homeData';
import { Link } from 'react-router-dom';

const GiftHampers = () => {
    return (
        <section className="py-20 bg-gray-50">
            <div className="container px-4">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                    <div>
                        <span className="text-primary font-bold uppercase tracking-wider text-sm">Special Collections</span>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2">Curated Gift Hampers</h2>
                    </div>
                    <Link to="/category/gift-hampers" className="hidden md:inline-flex items-center text-primary font-semibold hover:underline mt-4 md:mt-0">
                        View All Collections &rarr;
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((item, index) => (
                        <div key={item.id} className="group relative rounded-xl overflow-hidden shadow-md">
                            <div className="h-80 w-full overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                                <span className="text-white/80 text-xs font-bold uppercase tracking-widest mb-2">Collection 0{index + 1}</span>
                                <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                                <Link to={item.link} className="text-white text-sm font-semibold border-b border-white pb-1 inline-block w-max hover:text-primary hover:border-primary transition-colors">
                                    Explore Now
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default GiftHampers;
