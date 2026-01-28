"""
Cars Routes - MongoDB Version
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Depends
from pydantic import BaseModel
from pymongo.database import Database
from app.core.mongodb import get_db
from app.core import crud

router = APIRouter(prefix="/cars", tags=["Cars"])


# ============ Schemas ============

class CarResponse(BaseModel):
    id: str
    model: str
    number_plate: str
    daily_price: float
    deposit: float
    image_url: Optional[str]
    seats: int
    transmission: str
    fuel_type: str
    description: Optional[str]
    is_active: bool


def car_to_response(car: dict) -> dict:
    return {
        "id": car.get("id"),
        "model": car.get("model"),
        "number_plate": car.get("number_plate"),
        "daily_price": float(car.get("daily_price", 0)),
        "deposit": float(car.get("deposit", 0)),
        "image_url": car.get("image_url"),
        "seats": car.get("seats", 5),
        "transmission": car.get("transmission", "automatic"),
        "fuel_type": car.get("fuel_type", "petrol"),
        "description": car.get("description"),
        "is_active": car.get("is_active", True),
    }


# ============ Routes ============

@router.get("", response_model=List[CarResponse])
def list_cars(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    transmission: Optional[str] = None,
    fuel_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Database = Depends(get_db)
):
    """List all active cars with optional filters"""
    cars = crud.get_all_cars(db, active_only=True)
    
    # Apply filters
    if transmission:
        cars = [c for c in cars if c.get("transmission") == transmission]
    if fuel_type:
        cars = [c for c in cars if c.get("fuel_type") == fuel_type]
    if min_price is not None:
        cars = [c for c in cars if float(c.get("daily_price", 0)) >= min_price]
    if max_price is not None:
        cars = [c for c in cars if float(c.get("daily_price", 0)) <= max_price]
    
    # Pagination
    cars = cars[skip:skip + limit]
    
    return [car_to_response(car) for car in cars]


@router.get("/{car_id}", response_model=CarResponse)
def get_car(car_id: str, db: Database = Depends(get_db)):
    """Get car details"""
    car = crud.get_car_by_id(db, car_id)
    
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    
    return car_to_response(car)


@router.get("/{car_id}/availability")
def get_car_availability(car_id: str, db: Database = Depends(get_db)):
    """Get availability for a car (simplified - returns booked periods)"""
    car = crud.get_car_by_id(db, car_id)
    
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    
    # Return empty list for now (could be enhanced to return booked dates)
    return []
