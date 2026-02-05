import { useState } from 'react';
import { Phone, MessageCircle, MapPin, Copy, Check, Instagram, Facebook } from 'lucide-react';

export default function Contact() {
    const [copied, setCopied] = useState(false);

    // Default contact info - can be updated with real data
    const contactInfo = {
        phone: '+91 6302650017',
        whatsapp: '+916302650017',
        address: 'Bangalore, Karnataka, India',
        mapsLink: 'https://maps.google.com',
        instagram: 'https://instagram.com/suryacarrental',
        facebook: 'https://facebook.com/suryacarrental'
    };

    const handleCopyPhone = () => {
        navigator.clipboard.writeText(contactInfo.phone);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        const message = encodeURIComponent('Hi Surya Car Rental, I want to inquire about renting a car.');
        window.open(`https://wa.me/${contactInfo.whatsapp}?text=${message}`, '_blank');
    };

    return (
        <section className="py-20 relative" id="contact">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Get In Touch
                    </h2>
                    <p className="text-gray-400 text-lg">
                        We're here to help. Reach out anytime!
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Phone */}
                    <div className="glass-card group">
                        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4 mx-auto group-hover:scale-110 transition-transform">
                            <Phone className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3 text-center">Call Us</h3>
                        <p className="text-gray-400 text-center mb-4">{contactInfo.phone}</p>
                        <button
                            onClick={handleCopyPhone}
                            className="btn-ghost text-white w-full flex items-center justify-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copy Number
                                </>
                            )}
                        </button>
                    </div>

                    {/* WhatsApp */}
                    <div className="glass-card group">
                        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 mx-auto group-hover:scale-110 transition-transform">
                            <MessageCircle className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3 text-center">WhatsApp</h3>
                        <p className="text-gray-400 text-center mb-4">Chat with us instantly</p>
                        <button
                            onClick={handleWhatsApp}
                            className="btn-primary text-white w-full flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Open WhatsApp
                        </button>
                    </div>

                    {/* Location */}
                    <div className="glass-card group">
                        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 mx-auto group-hover:scale-110 transition-transform">
                            <MapPin className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3 text-center">Visit Us</h3>
                        <p className="text-gray-400 text-center mb-4 text-sm">{contactInfo.address}</p>
                        <a
                            href={contactInfo.mapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ghost text-white w-full flex items-center justify-center gap-2"
                        >
                            <MapPin className="w-4 h-4" />
                            View on Maps
                        </a>
                    </div>
                </div>

                {/* Social Media */}
                <div className="mt-12 text-center">
                    <p className="text-gray-400 mb-4">Follow us on social media</p>
                    <div className="flex items-center justify-center gap-4">
                        <a
                            href={contactInfo.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 rounded-xl glass-card flex items-center justify-center hover:bg-white/10 transition-colors group"
                        >
                            <Instagram className="w-5 h-5 text-gray-400 group-hover:text-pink-400 transition-colors" />
                        </a>
                        <a
                            href={contactInfo.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 rounded-xl glass-card flex items-center justify-center hover:bg-white/10 transition-colors group"
                        >
                            <Facebook className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
