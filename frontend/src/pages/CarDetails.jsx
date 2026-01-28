import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Users, Fuel, Cog, IndianRupee,
    Calendar, AlertTriangle, Trophy, CheckCircle
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { carsAPI, bookingsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CarDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
        offerPrice: '',
    });

    useEffect(() => {
        fetchCarDetails();
    }, [id]);

    const fetchCarDetails = async () => {
        setLoading(true);
        try {
            const response = await carsAPI.get(id);
            setCar(response.data);
            setFormData(prev => ({
                ...prev,
                offerPrice: response.data.daily_price,
            }));
        } catch (err) {
            setError('Failed to load car details');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        const price = parseFloat(formData.offerPrice) || 0;
        return { days, total: days * price };
    };

    const handleBooking = async (e) => {
        e.preventDefault();

        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }

        setBooking(true);
        setError(null);
        setSuccess(null);

        try {
            const startTime = new Date(formData.startDate + 'T10:00:00');
            const endTime = new Date(formData.endDate + 'T10:00:00');

            await bookingsAPI.request({
                car_id: id,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                offer_price: parseFloat(formData.offerPrice),
            });

            setSuccess('Booking request submitted successfully!');
            setTimeout(() => navigate('/my-bookings'), 2000);
        } catch (err) {
            const message = err.response?.data?.detail || 'Failed to create booking';
            setError(message);
        } finally {
            setBooking(false);
        }
    };

    if (loading) {
        return <LoadingSpinner text="Loading car details..." />;
    }

    if (!car) {
        return (
            <div className="text-center py-12">
                <p className="text-red-400">Car not found</p>
                <button onClick={() => navigate('/cars')} className="btn-primary text-white mt-4">
                    Back to Cars
                </button>
            </div>
        );
    }

    const { days, total } = calculateTotal();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
            >
                <ArrowLeft className="w-5 h-5" />
                Back
            </button>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Car Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Image */}
                    <div className="glass-card p-0 overflow-hidden">
                        <img
                            src={car.image_url || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800'}
                            alt={car.model}
                            className="w-full h-64 md:h-96 object-cover"
                        />
                    </div>

                    {/* Info */}
                    <div className="glass-card">
                        <h1 className="text-3xl font-bold text-white mb-2">{car.model}</h1>
                        <p className="text-gray-400 mb-6">{car.number_plate}</p>

                        <div className="grid sm:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 rounded-xl bg-white/5 text-center">
                                <Users className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                                <p className="text-white font-semibold">{car.seats} Seats</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 text-center">
                                <Cog className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                                <p className="text-white font-semibold capitalize">{car.transmission}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 text-center">
                                <Fuel className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                                <p className="text-white font-semibold capitalize">{car.fuel_type}</p>
                            </div>
                        </div>

                        {car.description && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                                <p className="text-gray-400">{car.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Auction Info */}
                    <div className="glass-card bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/30">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                <Trophy className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Auction System</h3>
                                <p className="text-gray-400 text-sm">
                                    If multiple users request this car for overlapping dates, an auction will be triggered.
                                    The winner is determined based on your offer price and rental history.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Booking Form */}
                <div className="lg:col-span-1">
                    <div className="glass-card sticky top-28">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Book This Car
                        </h2>

                        {success && (
                            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                <p className="text-emerald-400 text-sm">{success}</p>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleBooking} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    min={formData.startDate}
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Your Offer (₹/day)
                                    <span className="text-xs text-gray-500 ml-2">
                                        Base: ₹{parseFloat(car.daily_price).toLocaleString()}
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.offerPrice}
                                    onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                                    min={car.daily_price}
                                    className="input-field"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Higher offers improve auction winning chances
                                </p>
                            </div>

                            {/* Summary */}
                            <div className="p-4 rounded-xl bg-white/5 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Duration</span>
                                    <span className="text-white">{days} day{days > 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Price per day</span>
                                    <span className="text-white flex items-center gap-1">
                                        <IndianRupee className="w-3 h-3" />
                                        {parseFloat(formData.offerPrice || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Security Deposit</span>
                                    <span className="text-white flex items-center gap-1">
                                        <IndianRupee className="w-3 h-3" />
                                        {parseFloat(car.deposit).toLocaleString()}
                                    </span>
                                </div>
                                <hr className="border-white/10 my-2" />
                                <div className="flex justify-between font-semibold">
                                    <span className="text-white">Total</span>
                                    <span className="text-primary-400 flex items-center gap-1">
                                        <IndianRupee className="w-4 h-4" />
                                        {(total + parseFloat(car.deposit)).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={booking}
                                className="btn-primary w-full text-white flex items-center justify-center gap-2"
                            >
                                {booking ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Request Booking
                                        <Calendar className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>


                    </div>
                </div>
            </div>
        </div>
    );
}
