"""
Azure Cosmos DB Connection Module (using MongoDB API)

Azure Cosmos DB supports the MongoDB wire protocol, allowing us to use the
standard pymongo library. This same code works for:
  - Local development: mongodb://localhost:27017
  - Azure Cosmos DB: mongodb://account:key@account.mongo.cosmos.azure.com:10255/?ssl=true...

See docs/AZURE_SETUP.md for detailed setup instructions.
"""
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import ConnectionFailure
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Global database connection
_client: MongoClient = None
_database: Database = None


def get_database() -> Database:
    """Get the MongoDB database instance"""
    global _client, _database
    
    if _database is None:
        connect_to_mongodb()
    
    return _database


def connect_to_mongodb():
    """Initialize MongoDB connection"""
    global _client, _database
    
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL[:50]}...")
        
        _client = MongoClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            retryWrites=False  # Required for Cosmos DB
        )
        
        # Verify connection
        _client.admin.command('ping')
        
        _database = _client[settings.DATABASE_NAME]
        logger.info(f"Connected to MongoDB database: {settings.DATABASE_NAME}")
        
        # Create indexes for better query performance
        _create_indexes()
        
    except ConnectionFailure as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


def close_mongodb_connection():
    """Close MongoDB connection"""
    global _client, _database
    
    if _client:
        _client.close()
        _client = None
        _database = None
        logger.info("MongoDB connection closed")


def _create_indexes():
    """Create database indexes for better performance"""
    global _database
    
    if _database is None:
        return
    
    try:
        # Users collection indexes
        _database.users.create_index("email", unique=True)
        
        # Cars collection indexes
        _database.cars.create_index("number_plate", unique=True)
        _database.cars.create_index("is_active")
        
        # Bookings collection indexes
        _database.bookings.create_index("user_id")
        _database.bookings.create_index("car_id")
        _database.bookings.create_index("status")
        _database.bookings.create_index([("car_id", 1), ("start_time", 1), ("end_time", 1)])
        
        # Auctions collection indexes
        _database.auctions.create_index("car_id")
        _database.auctions.create_index("status")
        
        # Bids collection indexes
        _database.bids.create_index("auction_id")
        _database.bids.create_index("user_id")
        _database.bids.create_index([("auction_id", 1), ("user_id", 1)], unique=True)
        
        # Rides collection indexes
        _database.rides.create_index("booking_id", unique=True)
        
        # Ratings collection indexes
        _database.ratings.create_index("ride_id", unique=True)
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.warning(f"Error creating indexes (may already exist): {e}")


# Dependency for FastAPI
def get_db():
    """Dependency to get database for FastAPI routes"""
    return get_database()
