import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const FloatingWhatsApp: React.FC = () => {
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowTooltip(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const message = "Hello! I'm interested in your products.";
        const encoded = encodeURIComponent(message);
        window.open(`https://api.whatsapp.com/send?phone=916385792718&text=${encoded}`, "_blank");
    };

    return (
        <div className="fixed bottom-[100px] right-6 md:right-8 z-[90] flex flex-col items-end gap-3 pointer-events-none">
            {showTooltip && (
                <div className="pointer-events-auto absolute bottom-0 right-full mr-4 bg-white px-5 py-3 rounded-2xl shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-right-2 duration-500 whitespace-nowrap">
                    <button
                        onClick={() => setShowTooltip(false)}
                        className="absolute -top-2 -right-2 bg-gray-100 text-gray-400 rounded-full p-1 hover:text-gray-600 border border-white"
                    >
                        <X size={12} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                        <p className="text-sm font-bold text-gray-800">Chat with us now!</p>
                    </div>
                </div>
            )}

            <button
                onClick={handleClick}
                className="pointer-events-auto group relative w-16 h-16 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 active:scale-95 transition-all duration-300"
            >
                <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-20 group-hover:hidden" />
                <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32" className="relative z-10 transition-transform group-hover:scale-110">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                </svg>
            </button>
        </div>
    );
};

export default FloatingWhatsApp;
