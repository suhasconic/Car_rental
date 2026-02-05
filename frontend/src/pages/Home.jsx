import { Link } from 'react-router-dom';
import {
    Car, Shield, Trophy, Star, ArrowRight,
    Zap, Lock, TrendingUp, ChevronRight
} from 'lucide-react';
import HowItWorks from '../components/HowItWorks';
import Services from '../components/Services';
import FAQ from '../components/FAQ';
import Contact from '../components/Contact';

export default function Home() {
    const features = [
        {
            icon: Shield,
            title: 'Trust-Weighted System',
            description: 'Our unique algorithm rewards good drivers with priority access and better rates.',
            gradient: 'from-emerald-500 to-teal-600',
        },
        {
            icon: Trophy,
            title: 'Fair Competition',
            description: 'When demand is high, our auction system ensures the most trusted drivers win.',
            gradient: 'from-amber-500 to-orange-600',
        },
        {
            icon: Lock,
            title: 'Secure & Reliable',
            description: 'Advanced booking protection with deposit-backed reservations.',
            gradient: 'from-blue-500 to-indigo-600',
        },
        {
            icon: TrendingUp,
            title: 'Build Your Reputation',
            description: 'Every ride counts. Good behavior unlocks exclusive benefits.',
            gradient: 'from-purple-500 to-pink-600',
        },
    ];

    const stats = [
        { value: '500+', label: 'Happy Drivers' },
        { value: '50+', label: 'Premium Cars' },
        { value: '4.9★', label: 'Avg Rating' },
        { value: '24/7', label: 'Support' },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-purple-900/20" />

                {/* Floating elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light text-sm text-primary-400 mb-6">
                            <Zap className="w-4 h-4" />
                            Trust-Weighted Car Rental Platform
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
                            <span className="text-white">Rent Premium Cars</span>
                            <br />
                            <span className="gradient-text">Based on Trust</span>
                        </h1>

                        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                            Experience the future of car rentals. Our reputation-driven system
                            ensures reliable drivers get priority access to the best vehicles.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/cars" className="btn-primary text-white inline-flex items-center justify-center gap-2 text-lg">
                                Browse Cars
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link to="/signup" className="btn-ghost text-white inline-flex items-center justify-center gap-2 text-lg">
                                Get Started
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
                        {stats.map((stat, index) => (
                            <div key={index} className="glass-card text-center">
                                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-gray-400">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Why Choose Surya?
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            We've reimagined car rentals with a trust-first approach that benefits everyone.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <div key={index} className="glass-card group">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-400">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <HowItWorks />

            {/* Services Section */}
            <Services />

            {/* Trust Scoring Section */}
            <section className="py-20 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            How Trust Scoring Works
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Your reputation is your key to premium access
                        </p>
                    </div>

                    <div className="glass-card max-w-3xl mx-auto">
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <Star className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Ratings Build Your Score</h4>
                                    <p className="text-gray-400 text-sm">Each ride is rated. High ratings boost your trust score significantly.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <TrendingUp className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Experience Matters</h4>
                                    <p className="text-gray-400 text-sm">More rides = higher trust. Consistent good behavior is rewarded.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <Trophy className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Win Auctions</h4>
                                    <p className="text-gray-400 text-sm">When multiple people want the same car, high trust + good offer wins.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                    <Shield className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Stay Accountable</h4>
                                    <p className="text-gray-400 text-sm">Damage or rash driving severely impacts your score. Drive responsibly!</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-center text-sm text-gray-400 font-mono">
                                Trust Score = (Rating × 20) + (Rides × 0.5) - (Damage × 15) - (Rash × 10)
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <FAQ />

            {/* Contact Section */}
            <Contact />

            {/* CTA Section */}
            <section className="py-20 relative">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="glass-card text-center bg-gradient-to-br from-primary-900/40 to-purple-900/40">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-6 shadow-lg shadow-primary-500/30">
                            <Car className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Ready to Get Started?
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                            Join thousands of trusted drivers enjoying premium car rentals.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/signup" className="btn-primary text-white inline-flex items-center justify-center gap-2">
                                Create Account
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link to="/cars" className="btn-ghost text-white inline-flex items-center justify-center gap-2">
                                Browse Fleet
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                <Car className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="text-lg font-bold text-white">Surya</span>
                                <span className="text-xs block text-primary-400">Car Rental</span>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm">
                            © 2024 Surya Car Rental. Trust-weighted rentals for the modern driver.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
