import { Search, Calendar, KeyRound } from 'lucide-react';

export default function HowItWorks() {
    const steps = [
        {
            icon: Search,
            title: 'Choose Your Car',
            description: 'Browse our premium fleet and select the perfect vehicle for your needs',
            number: '01',
            gradient: 'from-primary-500 to-primary-700'
        },
        {
            icon: Calendar,
            title: 'Select Time Slot',
            description: 'Pick your preferred dates and duration. Flexible 12h or 24h options available',
            number: '02',
            gradient: 'from-blue-500 to-indigo-600'
        },
        {
            icon: KeyRound,
            title: 'Confirm & Drive',
            description: 'Complete booking, verify documents, and hit the road in minutes',
            number: '03',
            gradient: 'from-emerald-500 to-teal-600'
        }
    ];

    return (
        <section className="py-20 relative" id="how-it-works">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        How It Works
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Get on the road in three simple steps
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connection lines for desktop */}
                    <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500/50 via-blue-500/50 to-emerald-500/50" style={{ top: '6rem' }} />

                    {steps.map((step, index) => (
                        <div key={index} className="relative">
                            <div className="glass-card text-center group hover:scale-105 transition-all duration-300">
                                {/* Step number */}
                                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center">
                                    <span className="text-2xl font-bold gradient-text">{step.number}</span>
                                </div>

                                {/* Icon */}
                                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-2xl transition-shadow relative z-10`}>
                                    <step.icon className="w-10 h-10 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-white mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-gray-400">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
