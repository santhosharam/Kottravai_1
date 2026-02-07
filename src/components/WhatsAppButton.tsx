import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
    const phoneNumber = "919787030811"; // From footer
    const defaultMessage = "Hello, I would like to know more about your products.";

    // Whatapp URL format: https://wa.me/number?text=encoded_message
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:bg-[#20bd5a] hover:scale-110 transition-all duration-300 group"
            aria-label="Chat on WhatsApp"
        >
            <MessageCircle size={28} />
            <span className="absolute right-16 bg-white text-black text-sm px-3 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Chat with us
            </span>
        </a>
    );
};

export default WhatsAppButton;
