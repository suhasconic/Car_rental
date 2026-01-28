"""
Admin Routes - MongoDB Version
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Query, Depends
from pydantic import BaseModel
from pymongo.database import Database
from app.core.mongodb import get_db
from app.core import crud
from app.api.routes.auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


# ============ Schemas ============

class CarCreate(BaseModel):
    model: str
    number_plate: str
    daily_price: float
    deposit: float
    image_url: Optional[str] = None
    seats: int = 5
    transmission: str = "automatic"
    fuel_type: str = "petrol"
    description: Optional[str] = None


class CarUpdate(BaseModel):
    model: Optional[str] = None
    number_plate: Optional[str] = None
    daily_price: Optional[float] = None
    deposit: Optional[float] = None
    image_url: Optional[str] = None
    seats: Optional[int] = None
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RatingCreate(BaseModel):
    driving_rating: int
    damage_flag: bool = False
    rash_flag: bool = False
    notes: Optional[str] = None


# ============ Dashboard ============

@router.get("/dashboard")
def get_dashboard(
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """Get admin dashboard stats"""
    users = crud.get_all_users(db, role="user")
    cars = crud.get_all_cars(db, active_only=False)
    bookings = crud.get_all_bookings(db)
    auctions = crud.get_all_auctions(db)
    
    # Calculate stats
    pending_bookings = len([b for b in bookings if b.get("status") == "pending"])
    active_auctions = len([a for a in auctions if a.get("status") == "active"])
    blocked_users = len([u for u in users if u.get("is_blocked")])
    
    return {
        "total_users": len(users),
        "total_cars": len(cars),
        "total_bookings": len(bookings),
        "pending_bookings": pending_bookings,
        "active_auctions": active_auctions,
        "blocked_users": blocked_users,
        "recent_bookings": bookings[:5] if bookings else []
    }


# ============ Car Management ============

@router.post("/cars")
def add_car(
    car_data: CarCreate,
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """Add a new car"""
    car = crud.create_car(db, car_data.model_dump())
    return car


@router.put("/cars/{car_id}")
def update_car(
    car_id: str,
    car_data: CarUpdate,
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """Update car details"""
    car = crud.get_car_by_id(db, car_id)
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    
    update_data = {k: v for k, v in car_data.model_dump().items() if v is not None}
    updated_car = crud.update_car(db, car_id, update_data)
    return crud.serialize_doc(updated_car) if updated_car else None


@router.delete("/cars/{car_id}")
def delete_car(
    car_id: str,
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """Delete a car"""
    if not crud.delete_car(db, car_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    return {"message": "Car deleted successfully"}


# ============ Booking Management ============

@router.get("/bookings")
def list_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """List all bookings"""
    bookings = crud.get_all_bookings(db, status_filter)
    
    # Enrich with car and user info
    result = []
    for booking in bookings:
        car = crud.get_car_by_id(db, booking.get("car_id"))
        user = crud.get_user_by_id(db, booking.get("user_id"))
        
        result.append({
            **booking,
            "car": crud.serialize_doc(car) if car else None,
            "user": crud.serialize_doc(user) if user else None,
        })
    
    return result


@router.post("/bookings/{booking_id}/approve")
def approve_booking(
    booking_id: str,
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """Approve a pending booking"""
    booking = crud.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    
    if booking.get("status") != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending bookings can be approved"
        )
    
    crud.update_booking(db, booking_id, {"status": "confirmed"})
    return {"message": "Booking approved successfully"}


@router.post("/bookings/{booking_id}/reject")
def reject_booking(
    booking_id: str,
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """Reject a pending booking"""
    booking = crud.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    
    if booking.get("status") not in ["pending", "competing"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This booking cannot be rejected"
        )
    
    crud.update_booking(db, booking_id, {"status": "rejected"})
    return {"message": "Booking rejected successfully"}


# ============ Ride Management ============

@router.post("/bookings/{booking_id}/start-ride")
def start_ride(
    booking_id: str,
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """Start a ride for a confirmed booking"""
    booking = crud.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    
    if booking.get("status") != "confirmed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only confirmed bookings can start a ride"
        )
    
    # Check if ride already exists
    existing_ride = crud.get_ride_by_booking(db, booking_id)
    if existing_ride:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride already started for this booking"
        )
    
    ride = crud.create_ride(db, {"booking_id": booking_id})
    crud.update_booking(db, booking_id, {"status": "active"})
    
    return ride


@router.post("/rides/{ride_id}/complete")
def complete_ride(
    ride_id: str,
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """Complete a ride"""
    ride = crud.get_ride_by_id(db, ride_id)
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found")
    
    if ride.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride is not active"
        )
    
    crud.update_ride(db, ride_id, {
        "status": "completed",
        "ended_at": datetime.utcnow()
    })
    
    # Update booking status
    crud.update_booking(db, ride.get("booking_id"), {"status": "completed"})
    
    return {"message": "Ride completed successfully"}


@router.post("/rides/{ride_id}/rate")
def rate_ride(
    ride_id: str,
    rating_data: RatingCreate,
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """Rate a completed ride"""
    ride = crud.get_ride_by_id(db, ride_id)
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found")
    
    if ride.get("status") != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only completed rides can be rated"
        )
    
    # Check if already rated
    existing_rating = crud.get_rating_by_ride(db, ride_id)
    if existing_rating:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ride already rated"
        )
    
    # Create rating
    rating = crud.create_rating(db, {
        "ride_id": ride_id,
        **rating_data.model_dump()
    })
    
    # Update user stats
    booking = crud.get_booking_by_id(db, ride.get("booking_id"))
    if booking:
        user = crud.get_user_by_id(db, booking.get("user_id"))
        if user:
            total_rides = user.get("total_rides", 0) + 1
            damage_count = user.get("damage_count", 0) + (1 if rating_data.damage_flag else 0)
            rash_count = user.get("rash_count", 0) + (1 if rating_data.rash_flag else 0)
            
            # Calculate new average rating
            current_avg = float(user.get("avg_rating", 0))
            new_avg = ((current_avg * (total_rides - 1)) + rating_data.driving_rating) / total_rides
            
            # Calculate new trust score
            trust_score = (
                (new_avg * 20) +
                (total_rides * 0.5) -
                (damage_count * 15) -
                (rash_count * 10)
            )
            trust_score = max(0, trust_score)
            
            crud.update_user(db, user.get("id"), {
                "total_rides": total_rides,
                "avg_rating": new_avg,
                "damage_count": damage_count,
                "rash_count": rash_count,
                "trust_score": trust_score
            })
    
    return rating


# ============ User Management ============

@router.get("/users")
def list_users(
    blocked_only: bool = Query(False),
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """List all users"""
    users = crud.get_all_users(db, role="user", blocked_only=blocked_only)
    return users


@router.get("/users/leaderboard")
def get_leaderboard(
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """Get top users by trust score"""
    users = crud.get_all_users(db, role="user")
    # Already sorted by trust score in crud
    return users[:10]


@router.post("/users/{user_id}/block")
def block_user(
    user_id: str,
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """Block a user"""
    if not crud.block_user(db, user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "User blocked successfully"}


@router.post("/users/{user_id}/unblock")
def unblock_user(
    user_id: str,
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """Unblock a user"""
    if not crud.unblock_user(db, user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "User unblocked successfully"}


# ============ Auction Management ============

@router.get("/auctions")
def list_auctions(
    status_filter: Optional[str] = Query(None, alias="status"),
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """List all auctions"""
    auctions = crud.get_all_auctions(db, status_filter)
    
    # Enrich with car info and bids
    result = []
    for auction in auctions:
        car = crud.get_car_by_id(db, auction.get("car_id"))
        bids = crud.get_auction_bids(db, auction.get("id"))
        
        # Enrich bids with user info
        enriched_bids = []
        for bid in bids:
            user = crud.get_user_by_id(db, bid.get("user_id"))
            enriched_bids.append({
                **crud.serialize_doc(bid),
                "user": crud.serialize_doc(user) if user else None,
            })
        
        winner = None
        if auction.get("winner_id"):
            winner = crud.get_user_by_id(db, auction.get("winner_id"))
        
        result.append({
            **auction,
            "car": crud.serialize_doc(car) if car else None,
            "bids": enriched_bids,
            "winner": crud.serialize_doc(winner) if winner else None,
        })
    
    return result


@router.post("/auctions/{auction_id}/close")
def close_auction(
    auction_id: str,
    admin: dict = Depends(get_current_admin),
    db: Database = Depends(get_db)
):
    """Close an auction and determine winner"""
    auction = crud.get_auction_by_id(db, auction_id)
    if not auction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auction not found")
    
    if auction.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Auction is not active"
        )
    
    # Get all bids and calculate final scores
    bids = crud.get_auction_bids(db, auction_id)
    if not bids:
        crud.update_auction(db, auction_id, {"status": "cancelled"})
        return {"message": "Auction cancelled - no bids"}
    
    # Calculate final scores (trust-weighted)
    for bid in bids:
        trust = float(bid.get("trust_score_snapshot", 0))
        offer = float(bid.get("offer_price", 0))
        
        # Trust weight: higher trust = higher bonus multiplier
        trust_weight = 1 + (trust / 100)  # e.g., trust 80 = 1.8x multiplier
        final_score = offer * trust_weight
        
        crud.update_bid(db, bid.get("id"), {"final_score": final_score})
    
    # Find winner (highest final score)
    bids = crud.get_auction_bids(db, auction_id)  # Refresh
    winner_bid = max(bids, key=lambda b: float(b.get("final_score", 0)))
    
    # Update auction
    crud.update_auction(db, auction_id, {
        "status": "closed",
        "winner_id": winner_bid.get("user_id")
    })
    
    # Update bookings
    for bid in bids:
        if bid.get("id") == winner_bid.get("id"):
            crud.update_booking(db, bid.get("booking_id"), {"status": "confirmed"})
        else:
            crud.update_booking(db, bid.get("booking_id"), {"status": "lost_auction"})
    
    winner = crud.get_user_by_id(db, winner_bid.get("user_id"))
    return {
        "message": "Auction closed",
        "winner": crud.serialize_doc(winner) if winner else None,
        "winning_score": winner_bid.get("final_score")
    }
