"""
Authentication Routes - MongoDB Version
"""
from datetime import timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from typing import Optional
from pymongo.database import Database
from app.core.mongodb import get_db
from app.core.security import verify_password, create_access_token, decode_access_token
from app.core import crud

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ============ Schemas ============

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str]
    role: str
    total_rides: int
    avg_rating: float
    damage_count: int
    rash_count: int
    trust_score: float
    is_blocked: bool


# ============ Dependencies ============

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Database = Depends(get_db)
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = crud.get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception
    
    if user.get("is_blocked"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked"
        )
    
    return user


def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def user_to_response(user: dict) -> dict:
    return {
        "id": user.get("id"),
        "name": user.get("name"),
        "email": user.get("email"),
        "phone": user.get("phone"),
        "role": user.get("role"),
        "total_rides": user.get("total_rides", 0),
        "avg_rating": float(user.get("avg_rating", 0)),
        "damage_count": user.get("damage_count", 0),
        "rash_count": user.get("rash_count", 0),
        "trust_score": float(user.get("trust_score", 50)),
        "is_blocked": user.get("is_blocked", False),
    }


# ============ Routes ============

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, db: Database = Depends(get_db)):
    """Register a new user"""
    # Check if email already exists
    existing_user = crud.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = crud.create_user(db, user_data.model_dump())
    return user_to_response(user)


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Database = Depends(get_db)
):
    """Login and get access token"""
    user = crud.get_user_by_email(db, form_data.username)
    
    if not user or not verify_password(form_data.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.get("is_blocked"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked"
        )
    
    access_token = create_access_token(
        data={"sub": user.get("id"), "role": user.get("role")}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login/json", response_model=Token)
def login_json(credentials: UserLogin, db: Database = Depends(get_db)):
    """Login with JSON body"""
    user = crud.get_user_by_email(db, credentials.email)
    
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if user.get("is_blocked"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked"
        )
    
    access_token = create_access_token(
        data={"sub": user.get("id"), "role": user.get("role")}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return user_to_response(current_user)
