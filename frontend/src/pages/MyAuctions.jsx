import { useState, useEffect } from 'react';
import { Trophy, IndianRupee, Clock, Users, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { auctionsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MyAuctions() {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [bidding, setBidding] = useState(false);
    const [bidError, setBidError] = useState(null);

    useEffect(() => {
        fetchAuctions();
    }, []);

    const fetchAuctions = async () => {
        setLoading(true);
        try {
            const response = await auctionsAPI.getMy();
            setAuctions(response.data);
        } catch (err) {
            console.error('Failed to fetch auctions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBid = async (auctionId) => {
        if (!bidAmount || parseFloat(bidAmount) <= 0) {
            setBidError('Please enter a valid amount');
            return;
        }

        setBidding(true);
        setBidError(null);

        try {
            await auctionsAPI.bid(auctionId, parseFloat(bidAmount));
            await fetchAuctions();
            setSelectedAuction(null);
            setBidAmount('');
        } catch (err) {
            setBidError(err.response?.data?.detail || 'Failed to place bid');
        } finally {
            setBidding(false);
        }
    };

    if (loading) {
        return <LoadingSpinner text="Loading auctions..." />;
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">My Auctions</h1>
                <p className="text-gray-400 mt-1">Auctions you're participating in</p>
            </div>

            {auctions.length === 0 ? (
                <div className="glass-card text-center py-12">
                    <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No active auctions</h3>
                    <p className="text-gray-400">
                        When multiple bookings compete for the same car, you'll see auctions here.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {auctions.map((auction) => {
                        const myBid = auction.bids?.find(b => b.booking_id);
                        const highestBid = auction.bids?.reduce((max, b) =>
                            parseFloat(b.offer_price) > parseFloat(max?.offer_price || 0) ? b : max
                            , null);
                        const isWinning = myBid?.id === highestBid?.id;

                        return (
                            <div key={auction.id} className="glass-card">
                                {/* Header */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden">
                                            <img
                                                src={auction.car?.image_url || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200'}
                                                alt={auction.car?.model}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{auction.car?.model}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <StatusBadge status={auction.status} />
                                                <span className="text-gray-400 text-sm flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {auction.bid_count} bidders
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        {auction.auction_end && (
                                            <p className="text-gray-400 text-sm flex items-center justify-end gap-1">
                                                <Clock className="w-4 h-4" />
                                                Ends {formatDistanceToNow(new Date(auction.auction_end), { addSuffix: true })}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Booking Period */}
                                <div className="flex items-center gap-4 text-sm mb-6 p-4 rounded-xl bg-white/5">
                                    <div>
                                        <p className="text-gray-400">Rental Period</p>
                                        <p className="text-white font-medium">
                                            {format(new Date(auction.start_time), 'MMM dd')} - {format(new Date(auction.end_time), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                </div>

                                {/* Current Standing */}
                                {myBid && (
                                    <div className={`p-4 rounded-xl mb-6 ${isWinning ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`font-medium ${isWinning ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                    {isWinning ? '🏆 You\'re currently winning!' : '⚡ You\'re not in the lead'}
                                                </p>
                                                <p className="text-gray-400 text-sm mt-1">
                                                    Your bid: ₹{parseFloat(myBid.offer_price).toLocaleString()}/day
                                                </p>
                                            </div>
                                            {!isWinning && highestBid && (
                                                <div className="text-right">
                                                    <p className="text-gray-400 text-sm">Leading bid</p>
                                                    <p className="text-white font-semibold">₹{parseFloat(highestBid.offer_price).toLocaleString()}/day</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Bids List */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-gray-400 mb-3">All Bids</h4>
                                    <div className="space-y-2">
                                        {auction.bids?.sort((a, b) => parseFloat(b.offer_price) - parseFloat(a.offer_price)).map((bid, index) => (
                                            <div
                                                key={bid.id}
                                                className={`flex items-center justify-between p-3 rounded-xl ${index === 0 ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-white/5'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-400 text-sm">#{index + 1}</span>
                                                    <span className="text-white">{bid.user?.name || 'User'}</span>
                                                </div>
                                                <span className="text-white font-semibold flex items-center gap-1">
                                                    <IndianRupee className="w-4 h-4" />
                                                    {parseFloat(bid.offer_price).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Update Bid */}
                                {auction.status === 'active' && (
                                    <div className="pt-4 border-t border-white/10">
                                        {selectedAuction === auction.id ? (
                                            <div className="space-y-4">
                                                {bidError && (
                                                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                                                        <AlertCircle className="w-4 h-4 text-red-400" />
                                                        <span className="text-red-400 text-sm">{bidError}</span>
                                                    </div>
                                                )}
                                                <div className="flex gap-3">
                                                    <input
                                                        type="number"
                                                        value={bidAmount}
                                                        onChange={(e) => setBidAmount(e.target.value)}
                                                        placeholder="Enter new bid amount"
                                                        className="input-field flex-1"
                                                    />
                                                    <button
                                                        onClick={() => handleBid(auction.id)}
                                                        disabled={bidding}
                                                        className="btn-primary text-white"
                                                    >
                                                        {bidding ? 'Bidding...' : 'Submit Bid'}
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedAuction(null); setBidError(null); }}
                                                        className="btn-ghost text-white"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setSelectedAuction(auction.id); setBidAmount(myBid ? parseFloat(myBid.offer_price) + 100 : ''); }}
                                                className="btn-secondary text-white flex items-center gap-2"
                                            >
                                                <Trophy className="w-5 h-5" />
                                                Update Your Bid
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
