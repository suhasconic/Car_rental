import { Link, useNavigate } from 'react-router-dom';
import {
    Car, Menu, X, User, LogOut, LayoutDashboard,
    Calendar, Trophy, Shield, ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../store/authStore';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { user, logout, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
        setShowUserMenu(false);
    };

    const isAdmin = user?.role === 'admin';

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 transition-shadow">
                            <Car className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-white">Surya</span>
                            <span className="text-xs block text-primary-400 font-medium -mt-1">Car Rental</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/cars" className="text-gray-300 hover:text-white transition-colors font-medium">
                            Browse Cars
                        </Link>

                        {isAuthenticated() && !isAdmin && (
                            <>
                                <Link to="/my-bookings" className="text-gray-300 hover:text-white transition-colors font-medium">
                                    My Bookings
                                </Link>
                                <Link to="/my-auctions" className="text-gray-300 hover:text-white transition-colors font-medium">
                                    My Auctions
                                </Link>
                            </>
                        )}

                        {isAdmin && (
                            <Link to="/admin" className="text-gray-300 hover:text-white transition-colors font-medium flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Admin Panel
                            </Link>
                        )}
                    </div>

                    {/* User Menu / Auth Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        {isAuthenticated() ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-3 px-4 py-2 rounded-xl glass-light hover:bg-white/10 transition-colors"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                                        <span className="text-white font-semibold text-sm">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-medium text-sm">{user?.name}</p>
                                        {isAdmin && <span className="text-xs text-primary-400">Admin</span>}
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-56 glass rounded-xl shadow-xl border border-white/10 py-2 animate-in fade-in slide-in-from-top-2">
                                        <Link
                                            to="/profile"
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <User className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-200">Profile</span>
                                        </Link>

                                        {!isAdmin && (
                                            <>
                                                <Link
                                                    to="/my-bookings"
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                                                    onClick={() => setShowUserMenu(false)}
                                                >
                                                    <Calendar className="w-5 h-5 text-gray-400" />
                                                    <span className="text-gray-200">My Bookings</span>
                                                </Link>
                                                <Link
                                                    to="/my-auctions"
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                                                    onClick={() => setShowUserMenu(false)}
                                                >
                                                    <Trophy className="w-5 h-5 text-gray-400" />
                                                    <span className="text-gray-200">My Auctions</span>
                                                </Link>
                                            </>
                                        )}

                                        {isAdmin && (
                                            <Link
                                                to="/admin"
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                <LayoutDashboard className="w-5 h-5 text-gray-400" />
                                                <span className="text-gray-200">Admin Dashboard</span>
                                            </Link>
                                        )}

                                        <hr className="my-2 border-white/10" />

                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors w-full text-left"
                                        >
                                            <LogOut className="w-5 h-5 text-red-400" />
                                            <span className="text-red-400">Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="btn-ghost text-white">
                                    Login
                                </Link>
                                <Link to="/signup" className="btn-primary text-white">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="md:hidden glass border-t border-white/10">
                    <div className="px-4 py-4 space-y-3">
                        <Link
                            to="/cars"
                            className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Browse Cars
                        </Link>

                        {isAuthenticated() ? (
                            <>
                                {!isAdmin && (
                                    <>
                                        <Link
                                            to="/my-bookings"
                                            className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            My Bookings
                                        </Link>
                                        <Link
                                            to="/my-auctions"
                                            className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            My Auctions
                                        </Link>
                                    </>
                                )}

                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Admin Panel
                                    </Link>
                                )}

                                <Link
                                    to="/profile"
                                    className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Profile
                                </Link>

                                <button
                                    onClick={() => { handleLogout(); setIsOpen(false); }}
                                    className="block w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-red-400"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="flex gap-3 pt-3">
                                <Link
                                    to="/login"
                                    className="flex-1 btn-ghost text-center text-white"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="flex-1 btn-primary text-center text-white"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
