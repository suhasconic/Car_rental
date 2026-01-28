import { useEffect } from 'react';
import { Mail, Phone, Car, Star } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function Profile() {
    const { user, refreshUser } = useAuthStore();

    useEffect(() => {
        refreshUser();
    }, []);

    const stats = [
        { label: 'Total Rides', value: user?.total_rides || 0, icon: Car, color: 'text-blue-400' },
        { label: 'Avg Rating', value: parseFloat(user?.avg_rating || 0).toFixed(1), icon: Star, color: 'text-yellow-400' },
    ];

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>

            {/* Profile Card */}
            <div className="glass-card mb-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center shadow-lg">
                        <span className="text-3xl font-bold text-white">
                            {user?.name?.charAt(0).toUpperCase()}
                        </span>
                    </div>

                    <div className="text-center sm:text-left flex-1">
                        <h2 className="text-2xl font-bold text-white mb-1">{user?.name}</h2>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-gray-400 text-sm">
                            <span className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {user?.email}
                            </span>
                            {user?.phone && (
                                <span className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {user?.phone}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="glass-card">
                <h3 className="text-lg font-semibold text-white mb-6">Your Activity</h3>

                <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="p-4 rounded-xl bg-white/5 text-center">
                            <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-gray-400 text-sm">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {user?.is_blocked && (
                    <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                        <p className="text-red-400 text-sm">
                            🚫 Your account is currently blocked. Please contact support to resolve this.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
