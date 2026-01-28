"""
Bookings Routes - MongoDB Version
"""
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status, Query, Depends
from pydantic import BaseModel
from pymongo.database import Database
from app.core.mongodb import get_db
from app.core.config import settings
from app.core import crud
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/bookings", tags=["Bookings"])


# ============ Schemas ============

class BookingCreate(BaseModel):
    car_id: str
    start_time: datetime
    end_time: datetime
    offer_price: float


class BookingResponse(BaseModel):
    id: str
    user_id: str
    car_id: str
    start_time: datetime
    end_time: datetime
    offer_price: float
    status: str
    created_at: datetime


def booking_to_response(booking: dict, db: Database) -> dict:
    car = crud.get_car_by_id(db, booking.get("car_id"))
    user = crud.get_user_by_id(db, booking.get("user_id"))
    
    # Handle datetime conversion
    start_time = booking.get("start_time")
    end_time = booking.get("end_time")
    created_at = booking.get("created_at")
    updated_at = booking.get("updated_at")
    
    if isinstance(start_time, str):
        start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
    if isinstance(end_time, str):
        end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    if isinstance(updated_at, str):
        updated_at = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
    
    return {
        "id": booking.get("id"),
        "user_id": booking.get("user_id"),
        "car_id": booking.get("car_id"),
        "start_time": start_time.isoformat() if start_time else None,
        "end_time": end_time.isoformat() if end_time else None,
        "offer_price": float(booking.get("offer_price", 0)),
        "status": booking.get("status"),
        "created_at": created_at.isoformat() if created_at else None,
        "updated_at": updated_at.isoformat() if updated_at else None,
        "car": {
            "id": car.get("id"),
            "model": car.get("model"),
            "number_plate": car.get("number_plate"),
            "daily_price": float(car.get("daily_price", 0)),
            "deposit": float(car.get("deposit", 0)),
            "image_url": car.get("image_url"),
            "seats": car.get("seats"),
            "transmission": car.get("transmission"),
            "fuel_type": car.get("fuel_type"),
        } if car else None,
        "user": {
            "id": user.get("id"),
            "name": user.get("name"),
            "total_rides": user.get("total_rides", 0),
            "avg_rating": float(user.get("avg_rating", 0)),
            "trust_score": float(user.get("trust_score", 50)),
            "is_blocked": user.get("is_blocked", False),
        } if user else None,
    }


# ============ Routes ============

@router.post("/request")
def request_booking(
    booking_data: BookingCreate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Request a booking for a car"""
    if booking_data.start_time >= booking_data.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time"
        )
    
    # Check if user should be auto-rejected
    trust_score = float(current_user.get("trust_score", 50))
    if trust_score < settings.AUTO_REJECT_THRESHOLD or current_user.get("is_blocked"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account is not eligible for bookings at this time."
        )
    
    # Check if car exists
    car = crud.get_car_by_id(db, booking_data.car_id)
    if not car or not car.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Car not found or not available"
        )
    
    # Check for confirmed bookings (hard block)
    all_bookings = crud.get_all_bookings(db, status="confirmed")
    for b in all_bookings:
        if b.get("car_id") == booking_data.car_id:
            b_start = b.get("start_time")
            b_end = b.get("end_time")
            if isinstance(b_start, str):
                b_start = datetime.fromisoformat(b_start.replace('Z', '+00:00'))
            if isinstance(b_end, str):
                b_end = datetime.fromisoformat(b_end.replace('Z', '+00:00'))
            
            if b_start < booking_data.end_time and b_end > booking_data.start_time:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Car is already booked for this time period."
                )
    
    # Create booking
    booking = crud.create_booking(db, {
        "user_id": current_user.get("id"),
        "car_id": booking_data.car_id,
        "start_time": booking_data.start_time,
        "end_time": booking_data.end_time,
        "offer_price": booking_data.offer_price,
    })
    
    # Check for conflicts
    conflicts = crud.get_conflicting_bookings(
        db,
        booking_data.car_id,
        booking_data.start_time,
        booking_data.end_time,
        exclude_id=booking.get("id")
    )
    
    if conflicts:
        # Create or get auction
        auction = crud.find_active_auction_for_car(
            db,
            booking_data.car_id,
            booking_data.start_time,
            booking_data.end_time
        )
        
        if not auction:
            auction = crud.create_auction(db, {
                "car_id": booking_data.car_id,
                "start_time": booking_data.start_time,
                "end_time": booking_data.end_time,
                "auction_end": datetime.utcnow() + timedelta(hours=settings.AUCTION_DURATION_HOURS)
            })
        
        # Add all conflicts to auction
        for conflict in conflicts:
            existing_bid = crud.get_bid_by_user_auction(
                db,
                conflict.get("user_id"),
                auction.get("id")
            )
            if not existing_bid:
                conflict_user = crud.get_user_by_id(db, conflict.get("user_id"))
                crud.create_bid(db, {
                    "auction_id": auction.get("id"),
                    "user_id": conflict.get("user_id"),
                    "booking_id": conflict.get("id"),
                    "offer_price": conflict.get("offer_price"),
                    "trust_score_snapshot": conflict_user.get("trust_score", 50) if conflict_user else 50
                })
                crud.update_booking(db, conflict.get("id"), {"status": "competing"})
        
        # Add current booking to auction
        existing_bid = crud.get_bid_by_user_auction(
            db,
            current_user.get("id"),
            auction.get("id")
        )
        if not existing_bid:
            crud.create_bid(db, {
                "auction_id": auction.get("id"),
                "user_id": current_user.get("id"),
                "booking_id": booking.get("id"),
                "offer_price": booking_data.offer_price,
                "trust_score_snapshot": current_user.get("trust_score", 50)
            })
        
        crud.update_booking(db, booking.get("id"), {"status": "competing"})
        # Refresh booking data
        booking = crud.get_booking_by_id(db, booking.get("id"))
    
    return booking_to_response(booking, db)


@router.get("/my")
def get_my_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get all bookings for the current user"""
    bookings = crud.get_bookings_by_user(db, current_user.get("id"), status_filter)
    return [booking_to_response(b, db) for b in bookings]


@router.get("/{booking_id}")
def get_booking(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get booking details"""
    booking = crud.get_booking_by_id(db, booking_id)
    
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    
    if booking.get("user_id") != current_user.get("id") and current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return booking_to_response(booking, db)


@router.post("/{booking_id}/cancel")
def cancel_booking(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Cancel a booking"""
    booking = crud.get_booking_by_id(db, booking_id)
    
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    
    if booking.get("user_id") != current_user.get("id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own bookings"
        )
    
    if booking.get("status") not in ["pending", "competing", "confirmed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This booking cannot be cancelled"
        )
    
    # Apply late cancellation penalty
    start_time = booking.get("start_time")
    if isinstance(start_time, str):
        start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
    start_time = start_time.replace(tzinfo=None) if start_time.tzinfo else start_time
    
    hours_until_start = (start_time - datetime.utcnow()).total_seconds() / 3600
    if hours_until_start < 24 and booking.get("status") == "confirmed":
        current_score = float(current_user.get("trust_score", 50))
        new_score = max(0, current_score - settings.LATE_CANCEL_PENALTY)
        crud.update_user(db, current_user.get("id"), {"trust_score": new_score})
    
    crud.update_booking(db, booking_id, {"status": "cancelled"})
    booking = crud.get_booking_by_id(db, booking_id)
    
    return booking_to_response(booking, db)
