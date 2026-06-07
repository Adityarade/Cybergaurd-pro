from datetime import datetime
from typing import Dict
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field

from app.database import Database
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.dependencies import get_current_user, User

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

class UserSignup(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, example="security_analyst")
    password: str = Field(..., min_length=4, example="supersecurepassword")
    role: str = Field(default="Admin", pattern="^(Viewer|Admin)$", example="Admin")

class UserLogin(BaseModel):
    username: str = Field(..., example="admin")
    password: str = Field(..., example="admin")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

@router.post("/signup", response_model=Dict[str, str], status_code=status.HTTP_201_CREATED)
async def signup(user: UserSignup):
    """Creates a new user with secure password hashing and custom role assignment."""
    existing_user = await Database.get_user(user.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    user_record = {
        "username": user.username,
        "hashed_password": hashed_password,
        "role": user.role,
        "created_at": datetime.utcnow()
    }
    
    success = await Database.create_user(user_record)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error registering user"
        )
        
    return {"message": "User registered successfully", "username": user.username, "role": user.role}

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    """JSON-based endpoint to authenticate credentials and issue JWT tokens."""
    user = await Database.get_user(user_data.username)
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token = create_access_token(subject=user["username"], role=user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "username": user["username"]
    }

@router.post("/token", response_model=TokenResponse)
async def login_oauth2_form(form_data: OAuth2PasswordRequestForm = Depends()):
    """Standard OAuth2 form-compatible endpoint for API authentication."""
    user = await Database.get_user(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token = create_access_token(subject=user["username"], role=user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "username": user["username"]
    }

@router.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile information for the authenticated user session."""
    return current_user
