"""
MongoDB CRUD Operations
Provides database operations for all collections
"""
from datetime import datetime
from decimal import Decimal
from uuid import uuid4, UUID
from typing import Dict, List, Optional, Any
from pymongo.database import Database
from bson import ObjectId
from app.core.security import get_password_hash

# ============ Helper Functions ============

def generate_id() -> str:
    """Generate a unique ID string"""
    return str(uuid4())


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    
    result = {}
    for key, value in doc.items():
        if key == "_id":
            continue  # Skip MongoDB's internal _id
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, Decimal):
            result[key] = float(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        elif isinstance(value, list):
            result[key] = [serialize_doc(item) if isinstance(item, dict) else item for item in value]
        else:
            result[key] = value
    
    return result


# ============ User CRUD ============

def create_user(db: Database, user_data: dict) -> dict:
    """Create a new user"""
    user = {
        "id": generate_id(),
        "name": user_data["name"],
        "email": user_data["email"],
        "phone": user_data.get("phone"),
        "password_hash": get_password_hash(user_data["password"]),
        "role": user_data.get("role", "user"),
        "total_rides": 0,
        "avg_rating": 0.00,
        "damage_count": 0,
        "rash_count": 0,
        "trust_score": 50.00,
        "is_blocked": False,
        "created_at": datetime.utcnow()
    }
    
    db.users.insert_one(user)
    return serialize_doc(user)


def get_user_by_email(db: Database, email: str) -> Optional[dict]:
    """Get user by email"""
    user = db.users.find_one({"email": email})
    return user  # Return raw for password verification


def get_user_by_id(db: Database, user_id: str) -> Optional[dict]:
    """Get user by ID"""
    user = db.users.find_one({"id": user_id})
    return user


def get_all_users(db: Database, role: str = None, blocked_only: bool = False) -> List[dict]:
    """Get all users with optional filters"""
    query = {}
    if role:
        query["role"] = role
    if blocked_only:
        query["is_blocked"] = True
    
    users = list(db.users.find(query).sort("trust_score", -1))
    return [serialize_doc(u) for u in users]


def update_user(db: Database, user_id: str, update_data: dict) -> Optional[dict]:
    """Update user fields"""
    db.users.update_one({"id": user_id}, {"$set": update_data})
    return get_user_by_id(db, user_id)


def block_user(db: Database, user_id: str) -> bool:
    """Block a user"""
    result = db.users.update_one({"id": user_id}, {"$set": {"is_blocked": True}})
    return result.modified_count > 0


def unblock_user(db: Database, user_id: str) -> bool:
    """Unblock a user"""
    result = db.users.update_one({"id": user_id}, {"$set": {"is_blocked": False}})
    return result.modified_count > 0


# ============ Car CRUD ============

def create_car(db: Database, car_data: dict) -> dict:
    """Create a new car"""
    car = {
        "id": generate_id(),
        "model": car_data["model"],
        "number_plate": car_data["number_plate"],
        "daily_price": float(car_data["daily_price"]),
        "deposit": float(car_data["deposit"]),
        "image_url": car_data.get("image_url"),
        "seats": car_data.get("seats", 5),
        "transmission": car_data.get("transmission", "automatic"),
        "fuel_type": car_data.get("fuel_type", "petrol"),
        "description": car_data.get("description"),
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    db.cars.insert_one(car)
    return serialize_doc(car)


def get_car_by_id(db: Database, car_id: str) -> Optional[dict]:
    """Get car by ID"""
    car = db.cars.find_one({"id": car_id})
    return car


def get_all_cars(db: Database, active_only: bool = True) -> List[dict]:
    """Get all cars"""
    query = {"is_active": True} if active_only else {}
    cars = list(db.cars.find(query))
    return [serialize_doc(c) for c in cars]


def update_car(db: Database, car_id: str, update_data: dict) -> Optional[dict]:
    """Update car fields"""
    db.cars.update_one({"id": car_id}, {"$set": update_data})
    return get_car_by_id(db, car_id)


def delete_car(db: Database, car_id: str) -> bool:
    """Delete a car"""
    result = db.cars.delete_one({"id": car_id})
    return result.deleted_count > 0


# ============ Booking CRUD ============

def create_booking(db: Database, booking_data: dict) -> dict:
    """Create a new booking"""
    booking = {
        "id": generate_id(),
        "user_id": booking_data["user_id"],
        "car_id": booking_data["car_id"],
        "start_time": booking_data["start_time"],
        "end_time": booking_data["end_time"],
        "offer_price": float(booking_data["offer_price"]),
        "status": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    db.bookings.insert_one(booking)
    return serialize_doc(booking)


def get_booking_by_id(db: Database, booking_id: str) -> Optional[dict]:
    """Get booking by ID"""
    booking = db.bookings.find_one({"id": booking_id})
    return booking


def get_bookings_by_user(db: Database, user_id: str, status: str = None) -> List[dict]:
    """Get bookings for a user"""
    query = {"user_id": user_id}
    if status:
        query["status"] = status
    
    bookings = list(db.bookings.find(query).sort("created_at", -1))
    return [serialize_doc(b) for b in bookings]


def get_all_bookings(db: Database, status: str = None) -> List[dict]:
    """Get all bookings"""
    query = {}
    if status:
        query["status"] = status
    
    bookings = list(db.bookings.find(query).sort("created_at", -1))
    return [serialize_doc(b) for b in bookings]


def update_booking(db: Database, booking_id: str, update_data: dict) -> Optional[dict]:
    """Update booking fields"""
    update_data["updated_at"] = datetime.utcnow()
    db.bookings.update_one({"id": booking_id}, {"$set": update_data})
    return get_booking_by_id(db, booking_id)


def get_conflicting_bookings(db: Database, car_id: str, start_time: datetime, 
                            end_time: datetime, exclude_id: str = None) -> List[dict]:
    """Get bookings that conflict with the given time range"""
    query = {
        "car_id": car_id,
        "status": {"$in": ["pending", "competing"]},
        "start_time": {"$lt": end_time},
        "end_time": {"$gt": start_time}
    }
    
    if exclude_id:
        query["id"] = {"$ne": exclude_id}
    
    bookings = list(db.bookings.find(query))
    return bookings


# ============ Auction CRUD ============

def create_auction(db: Database, auction_data: dict) -> dict:
    """Create a new auction"""
    auction = {
        "id": generate_id(),
        "car_id": auction_data["car_id"],
        "start_time": auction_data["start_time"],
        "end_time": auction_data["end_time"],
        "auction_start": datetime.utcnow(),
        "auction_end": auction_data.get("auction_end"),
        "status": "active",
        "winner_id": None,
        "created_at": datetime.utcnow()
    }
    
    db.auctions.insert_one(auction)
    return serialize_doc(auction)


def get_auction_by_id(db: Database, auction_id: str) -> Optional[dict]:
    """Get auction by ID"""
    auction = db.auctions.find_one({"id": auction_id})
    return auction


def get_all_auctions(db: Database, status: str = None) -> List[dict]:
    """Get all auctions"""
    query = {}
    if status:
        query["status"] = status
    
    auctions = list(db.auctions.find(query).sort("created_at", -1))
    return [serialize_doc(a) for a in auctions]


def get_auctions_by_user(db: Database, user_id: str) -> List[dict]:
    """Get auctions where user has placed bids"""
    # First find user's bids
    user_bids = list(db.bids.find({"user_id": user_id}))
    auction_ids = list(set(b["auction_id"] for b in user_bids))
    
    # Get active auctions
    auctions = list(db.auctions.find({
        "id": {"$in": auction_ids},
        "status": "active"
    }))
    return [serialize_doc(a) for a in auctions]


def update_auction(db: Database, auction_id: str, update_data: dict) -> Optional[dict]:
    """Update auction fields"""
    db.auctions.update_one({"id": auction_id}, {"$set": update_data})
    return get_auction_by_id(db, auction_id)


def find_active_auction_for_car(db: Database, car_id: str, start_time: datetime, 
                                end_time: datetime) -> Optional[dict]:
    """Find an active auction for the car and time range"""
    auction = db.auctions.find_one({
        "car_id": car_id,
        "status": "active",
        "start_time": {"$lt": end_time},
        "end_time": {"$gt": start_time}
    })
    return auction


# ============ Bid CRUD ============

def create_bid(db: Database, bid_data: dict) -> dict:
    """Create a new bid"""
    bid = {
        "id": generate_id(),
        "auction_id": bid_data["auction_id"],
        "user_id": bid_data["user_id"],
        "booking_id": bid_data["booking_id"],
        "offer_price": float(bid_data["offer_price"]),
        "trust_score_snapshot": float(bid_data["trust_score_snapshot"]),
        "final_score": None,
        "created_at": datetime.utcnow()
    }
    
    db.bids.insert_one(bid)
    return serialize_doc(bid)


def get_bid_by_user_auction(db: Database, user_id: str, auction_id: str) -> Optional[dict]:
    """Get bid by user and auction"""
    bid = db.bids.find_one({"user_id": user_id, "auction_id": auction_id})
    return bid


def get_auction_bids(db: Database, auction_id: str) -> List[dict]:
    """Get all bids for an auction"""
    bids = list(db.bids.find({"auction_id": auction_id}).sort("offer_price", -1))
    return bids


def update_bid(db: Database, bid_id: str, update_data: dict) -> Optional[dict]:
    """Update bid fields"""
    db.bids.update_one({"id": bid_id}, {"$set": update_data})
    return db.bids.find_one({"id": bid_id})


# ============ Ride CRUD ============

def create_ride(db: Database, ride_data: dict) -> dict:
    """Create a new ride"""
    ride = {
        "id": generate_id(),
        "booking_id": ride_data["booking_id"],
        "status": "active",
        "started_at": datetime.utcnow(),
        "ended_at": None
    }
    
    db.rides.insert_one(ride)
    return serialize_doc(ride)


def get_ride_by_id(db: Database, ride_id: str) -> Optional[dict]:
    """Get ride by ID"""
    ride = db.rides.find_one({"id": ride_id})
    return ride


def get_ride_by_booking(db: Database, booking_id: str) -> Optional[dict]:
    """Get ride by booking ID"""
    ride = db.rides.find_one({"booking_id": booking_id})
    return ride


def update_ride(db: Database, ride_id: str, update_data: dict) -> Optional[dict]:
    """Update ride fields"""
    db.rides.update_one({"id": ride_id}, {"$set": update_data})
    return get_ride_by_id(db, ride_id)


# ============ Rating CRUD ============

def create_rating(db: Database, rating_data: dict) -> dict:
    """Create a new rating"""
    rating = {
        "id": generate_id(),
        "ride_id": rating_data["ride_id"],
        "driving_rating": rating_data["driving_rating"],
        "damage_flag": rating_data.get("damage_flag", False),
        "rash_flag": rating_data.get("rash_flag", False),
        "notes": rating_data.get("notes"),
        "created_at": datetime.utcnow()
    }
    
    db.ratings.insert_one(rating)
    return serialize_doc(rating)


def get_rating_by_ride(db: Database, ride_id: str) -> Optional[dict]:
    """Get rating by ride ID"""
    rating = db.ratings.find_one({"ride_id": ride_id})
    return rating


# ============ Seed Data ============

def seed_database(db: Database):
    """Seed the database with initial data"""
    
    # Check if already seeded
    if db.users.count_documents({}) > 0:
        print("Database already seeded, skipping...")
        return
    
    print("\n🌱 Seeding database...")
    
    # Create admin user
    admin = {
        "id": generate_id(),
        "name": "Admin User",
        "email": "admin@surya.com",
        "phone": "+91-9876543210",
        "password_hash": get_password_hash("admin123"),
        "role": "admin",
        "total_rides": 0,
        "avg_rating": 0.00,
        "damage_count": 0,
        "rash_count": 0,
        "trust_score": 100.00,
        "is_blocked": False,
        "created_at": datetime.utcnow()
    }
    db.users.insert_one(admin)
    
    # Create regular users
    users_data = [
        {"name": "Rahul Sharma", "email": "rahul@example.com", "phone": "+91-9876543211",
         "total_rides": 25, "avg_rating": 4.80, "trust_score": 108.50},
        {"name": "Priya Patel", "email": "priya@example.com", "phone": "+91-9876543212",
         "total_rides": 15, "avg_rating": 4.50, "rash_count": 1, "trust_score": 87.50},
        {"name": "Amit Singh", "email": "amit@example.com", "phone": "+91-9876543213",
         "total_rides": 8, "avg_rating": 4.00, "damage_count": 1, "trust_score": 69.00},
        {"name": "Neha Gupta", "email": "neha@example.com", "phone": "+91-9876543214",
         "total_rides": 3, "avg_rating": 3.50, "damage_count": 1, "rash_count": 1, "trust_score": 36.50},
        {"name": "Vikram Reddy", "email": "vikram@example.com", "phone": "+91-9876543215",
         "total_rides": 0, "avg_rating": 0.00, "trust_score": 50.00},
    ]
    
    for data in users_data:
        user = {
            "id": generate_id(),
            "name": data["name"],
            "email": data["email"],
            "phone": data.get("phone"),
            "password_hash": get_password_hash("password123"),
            "role": "user",
            "total_rides": data.get("total_rides", 0),
            "avg_rating": data.get("avg_rating", 0.00),
            "damage_count": data.get("damage_count", 0),
            "rash_count": data.get("rash_count", 0),
            "trust_score": data.get("trust_score", 50.00),
            "is_blocked": False,
            "created_at": datetime.utcnow()
        }
        db.users.insert_one(user)
    
    # Create cars
    cars_data = [
        {"model": "Maruti Swift Dzire", "number_plate": "KA-01-AB-1234", "daily_price": 1500.00,
         "deposit": 5000.00, "seats": 5, "transmission": "manual", "fuel_type": "petrol",
         "description": "Compact sedan, perfect for city drives. Fuel efficient and easy to handle.",
         "image_url": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800"},
        {"model": "Hyundai Creta", "number_plate": "KA-01-CD-5678", "daily_price": 2500.00,
         "deposit": 10000.00, "seats": 5, "transmission": "automatic", "fuel_type": "diesel",
         "description": "Premium SUV with spacious interiors. Great for highway and long trips.",
         "image_url": "https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=800"},
        {"model": "Toyota Innova Crysta", "number_plate": "KA-01-EF-9012", "daily_price": 3500.00,
         "deposit": 15000.00, "seats": 7, "transmission": "automatic", "fuel_type": "diesel",
         "description": "Luxury MPV with captain seats. Ideal for family trips and airport transfers.",
         "image_url": "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800"},
        {"model": "Mahindra Thar", "number_plate": "KA-01-GH-3456", "daily_price": 3000.00,
         "deposit": 12000.00, "seats": 4, "transmission": "manual", "fuel_type": "diesel",
         "description": "Rugged off-roader for adventure seekers. 4x4 capable with convertible top.",
         "image_url": "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800"},
        {"model": "Honda City", "number_plate": "KA-01-IJ-7890", "daily_price": 2000.00,
         "deposit": 8000.00, "seats": 5, "transmission": "automatic", "fuel_type": "petrol",
         "description": "Executive sedan with premium features. Smooth CVT and excellent ride quality.",
         "image_url": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800"},
        {"model": "Kia Seltos", "number_plate": "KA-01-KL-1122", "daily_price": 2200.00,
         "deposit": 9000.00, "seats": 5, "transmission": "automatic", "fuel_type": "petrol",
         "description": "Feature-loaded compact SUV with sunroof and connected car tech.",
         "image_url": "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800"},
    ]
    
    for data in cars_data:
        car = {
            "id": generate_id(),
            "model": data["model"],
            "number_plate": data["number_plate"],
            "daily_price": data["daily_price"],
            "deposit": data["deposit"],
            "image_url": data.get("image_url"),
            "seats": data.get("seats", 5),
            "transmission": data.get("transmission", "automatic"),
            "fuel_type": data.get("fuel_type", "petrol"),
            "description": data.get("description"),
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        db.cars.insert_one(car)
    
    print("\n✅ Database seeded successfully!")
    print("\n📧 Login Credentials:")
    print("   Admin: admin@surya.com / admin123")
    print("   User:  rahul@example.com / password123")
    print("   User:  priya@example.com / password123")
    print("   User:  amit@example.com / password123")
    print("   User:  neha@example.com / password123")
    print("   User:  vikram@example.com / password123\n")
