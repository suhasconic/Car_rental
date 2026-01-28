from pydantic_settings import BaseSettings
from typing import Optional, List
import os


class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "Surya Car Rental"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # MongoDB/Cosmos DB Settings
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "surya_car_rental"
    
    # Legacy PostgreSQL (not used with MongoDB)
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/surya_car_rental"
    
    # JWT Settings
    SECRET_KEY: str = "your-super-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Trust Score Settings
    TRUST_THRESHOLD: float = 30.0  # Minimum trust for auction eligibility
    AUTO_REJECT_THRESHOLD: float = 10.0  # Auto-reject below this
    AUTO_BLOCK_THRESHOLD: float = 0.0  # Auto-block below this
    LATE_CANCEL_PENALTY: float = 5.0  # Trust penalty for late cancellation
    
    # Auction Settings
    AUCTION_DURATION_HOURS: int = 24  # How long auctions run
    
    # CORS - Allow Azure Static Web Apps and localhost
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.azurestaticapps.net"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

