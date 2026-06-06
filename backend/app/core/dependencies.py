from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import BaseModel

from app.core.security import SECRET_KEY, ALGORITHM
from app.database import Database

# OAuth2 scheme config. Tokens will be sent in Authorization headers as Bearer tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

class User(BaseModel):
    username: str
    role: str

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    FastAPI dependency that decodes JWT access tokens and fetches the user.
    Raises 401 Unauthorized if invalid or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Check user in database or fallback in-memory database
    user_data = await Database.get_user(username)
    if user_data is None:
        raise credentials_exception
        
    return User(username=user_data["username"], role=user_data["role"])

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Checks if the authenticated user is active."""
    # We can extend this if active status is added, but default is active.
    return current_user

def require_role(allowed_roles: List[str]):
    """
    FastAPI dependency creator to enforce access level constraints (RBAC).
    Raises 403 Forbidden if user's role is not within the allowed roles.
    """
    def dependency(current_user: User = Depends(get_current_active_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action forbidden for user role: {current_user.role}. Allowed roles: {allowed_roles}"
            )
        return current_user
    return dependency
