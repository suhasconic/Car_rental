from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.mongodb import connect_to_mongodb, close_mongodb_connection, get_database
from app.core.crud import seed_database

# Import routes
from app.api.routes import auth, cars, bookings, auctions, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events"""
    # Startup
    print("\n🚀 Starting Surya Car Rental API...")
    connect_to_mongodb()
    
    # Seed database with initial data
    db = get_database()
    seed_database(db)
    
    yield
    
    # Shutdown
    print("\n🛑 Shutting down Surya Car Rental API...")
    close_mongodb_connection()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Trust-weighted car rental marketplace with auction system",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(cars.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")
app.include_router(auctions.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "mode": "MongoDB/Cosmos DB",
        "docs": "/api/docs"
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "mode": "mongodb"}
