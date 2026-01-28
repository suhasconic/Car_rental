"""
Auctions Routes - MongoDB Version
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Query, Depends
from pymongo.database import Database
from app.core.mongodb import get_db
from app.core import crud
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/auctions", tags=["Auctions"])


def auction_to_response(auction: dict, db: Database, include_bids: bool = True) -> dict:
    car = crud.get_car_by_id(db, auction.get("car_id"))
    bids = crud.get_auction_bids(db, auction.get("id")) if include_bids else []
    
    # Enrich bids with user info
    enriched_bids = []
    for bid in bids:
        user = crud.get_user_by_id(db, bid.get("user_id"))
        enriched_bids.append({
            "id": bid.get("id"),
            "user_id": bid.get("user_id"),
            "booking_id": bid.get("booking_id"),
            "offer_price": float(bid.get("offer_price", 0)),
            "trust_score_snapshot": float(bid.get("trust_score_snapshot", 0)),
            "final_score": float(bid.get("final_score")) if bid.get("final_score") else None,
            "user": {
                "id": user.get("id"),
                "name": user.get("name"),
            } if user else None
        })
    
    return {
        "id": auction.get("id"),
        "car_id": auction.get("car_id"),
        "start_time": auction.get("start_time"),
        "end_time": auction.get("end_time"),
        "auction_start": auction.get("auction_start"),
        "auction_end": auction.get("auction_end"),
        "status": auction.get("status"),
        "winner_id": auction.get("winner_id"),
        "bid_count": len(bids),
        "car": {
            "id": car.get("id"),
            "model": car.get("model"),
            "number_plate": car.get("number_plate"),
            "image_url": car.get("image_url"),
        } if car else None,
        "bids": enriched_bids
    }


# ============ Routes ============

@router.get("")
def list_auctions(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Database = Depends(get_db)
):
    """List all auctions"""
    auctions = crud.get_all_auctions(db, status_filter)
    return [auction_to_response(a, db) for a in auctions]


@router.get("/my")
def get_my_auctions(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Get auctions user is participating in"""
    auctions = crud.get_auctions_by_user(db, current_user.get("id"))
    return [auction_to_response(a, db) for a in auctions]


@router.get("/{auction_id}")
def get_auction(
    auction_id: str,
    db: Database = Depends(get_db)
):
    """Get auction details"""
    auction = crud.get_auction_by_id(db, auction_id)
    
    if not auction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auction not found")
    
    return auction_to_response(auction, db)


@router.post("/{auction_id}/bid")
def place_bid(
    auction_id: str,
    offer_price: float = Query(..., gt=0),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """Place or update bid in an auction"""
    auction = crud.get_auction_by_id(db, auction_id)
    
    if not auction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auction not found")
    
    if auction.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Auction is not active"
        )
    
    # Check if user has existing bid
    existing_bid = crud.get_bid_by_user_auction(db, current_user.get("id"), auction_id)
    
    if existing_bid:
        # Update existing bid
        if offer_price <= float(existing_bid.get("offer_price", 0)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New bid must be higher than your current bid"
            )
        crud.update_bid(db, existing_bid.get("id"), {"offer_price": offer_price})
        
        # Also update the booking
        crud.update_booking(db, existing_bid.get("booking_id"), {"offer_price": offer_price})
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You don't have an active booking in this auction"
        )
    
    return {"message": "Bid updated successfully", "new_offer": offer_price}
