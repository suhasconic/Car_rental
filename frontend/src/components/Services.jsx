import { DollarSign, CreditCard, Headphones, ShieldCheck } from 'lucide-react';

export default function Services() {
    const services = [
        {
            icon: DollarSign,
            title: 'Competitive Pricing',
            description: 'Best rates in the market with transparent pricing. No hidden charges, ever.',
            gradient: 'from-emerald-500 to-teal-600'
        },
        {
            icon: CreditCard,
            title: 'Flexible Payment Plans',
            description: 'Multiple payment options including UPI, cards, and net banking. Pay your way.',
            gradient: 'from-blue-500 to-indigo-600'
        },
        {
            icon: Headphones,
            title: '24/7 Roadside Assistance',
            description: 'Round-the-clock support for emergencies. We\'re always here to help.',
            gradient: 'from-amber-500 to-orange-600'
        },
        {
            icon: ShieldCheck,
            title: 'Extended Warranties',
            description: 'Comprehensive insurance coverage on all vehicles for your peace of mind.',
            gradient: 'from-purple-500 to-pink-600'
        }
    ];

    return (
        <section className="py-20 relative" id="services">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        We Ensure the Best Customer Experience
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Premium services designed to make your rental experience seamless
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((service, index) => (
                        <div key={index} className="glass-card text-center group hover:scale-105 transition-transform">
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow`}>
                                <service.icon className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                {service.title}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {service.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
