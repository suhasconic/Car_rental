import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { carsAPI } from '../services/api';
import CarCard from '../components/CarCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Cars() {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const [filters, setFilters] = useState({
        transmission: '',
        fuelType: '',
        minPrice: '',
        maxPrice: '',
    });

    const categories = [
        { id: 'all', label: 'All Cars' },
        { id: 'hatchback', label: 'Hatchback' },
        { id: 'sedan', label: 'Sedan' },
        { id: 'suv', label: 'SUV' },
        { id: 'luxury', label: 'Luxury' }
    ];

    useEffect(() => {
        fetchCars();
    }, []);

    const fetchCars = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.transmission) params.transmission = filters.transmission;
            if (filters.fuelType) params.fuel_type = filters.fuelType;
            if (filters.minPrice) params.min_price = parseFloat(filters.minPrice);
            if (filters.maxPrice) params.max_price = parseFloat(filters.maxPrice);

            const response = await carsAPI.list(params);
            setCars(response.data);
        } catch (err) {
            setError('Failed to load cars');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
    };

    const applyFilters = () => {
        fetchCars();
        setShowFilters(false);
    };

    const clearFilters = () => {
        setFilters({
            transmission: '',
            fuelType: '',
            minPrice: '',
            maxPrice: '',
        });
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Browse Cars</h1>
                    <p className="text-gray-400 mt-1">Find the perfect car for your journey</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn-ghost text-white flex items-center gap-2 ${hasActiveFilters ? 'border-primary-500' : ''}`}
                    >
                        <Filter className="w-5 h-5" />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-primary-500" />
                        )}
                    </button>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="mb-8 overflow-x-auto">
                <div className="flex gap-3 min-w-max">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all ${selectedCategory === category.id
                                ? 'bg-gradient-to-r from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/30'
                                : 'glass-card text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="glass-card mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Filters</h3>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Transmission</label>
                            <select
                                value={filters.transmission}
                                onChange={(e) => handleFilterChange('transmission', e.target.value)}
                                className="input-field"
                            >
                                <option value="">All</option>
                                <option value="automatic">Automatic</option>
                                <option value="manual">Manual</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Fuel Type</label>
                            <select
                                value={filters.fuelType}
                                onChange={(e) => handleFilterChange('fuelType', e.target.value)}
                                className="input-field"
                            >
                                <option value="">All</option>
                                <option value="petrol">Petrol</option>
                                <option value="diesel">Diesel</option>
                                <option value="electric">Electric</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Min Price (₹/day)</label>
                            <input
                                type="number"
                                value={filters.minPrice}
                                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                className="input-field"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Max Price (₹/day)</label>
                            <input
                                type="number"
                                value={filters.maxPrice}
                                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                className="input-field"
                                placeholder="10000"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6">
                        <button onClick={applyFilters} className="btn-primary text-white">
                            Apply Filters
                        </button>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="btn-ghost text-white">
                                Clear All
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Cars Grid */}
            {loading ? (
                <LoadingSpinner text="Loading cars..." />
            ) : error ? (
                <div className="text-center py-12">
                    <p className="text-red-400">{error}</p>
                    <button onClick={fetchCars} className="btn-primary text-white mt-4">
                        Try Again
                    </button>
                </div>
            ) : cars.length === 0 ? (
                <div className="text-center py-12 glass-card">
                    <Search className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No cars found</h3>
                    <p className="text-gray-400">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cars
                        .filter(car => {
                            if (selectedCategory === 'all') return true;
                            // Filter by category based on car model/type
                            const model = car.model.toLowerCase();
                            if (selectedCategory === 'hatchback') {
                                return model.includes('swift') || model.includes('altroz') || model.includes('i20');
                            }
                            if (selectedCategory === 'sedan') {
                                return model.includes('dzire') || model.includes('city') || model.includes('verna');
                            }
                            if (selectedCategory === 'suv') {
                                return model.includes('creta') || model.includes('seltos') || model.includes('thar') || model.includes('innova');
                            }
                            if (selectedCategory === 'luxury') {
                                return model.includes('fortuner') || model.includes('crysta');
                            }
                            return true;
                        })
                        .map((car) => (
                            <CarCard key={car.id} car={car} />
                        ))}
                </div>
            )}
        </div>
    );
}
