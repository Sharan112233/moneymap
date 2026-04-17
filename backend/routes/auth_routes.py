from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, update
from database import get_db
import models, schemas
from auth import verify_password, get_password_hash, create_access_token, get_current_user
import re
router = APIRouter(prefix="/auth", tags=["auth"])

def is_valid_email(email: str) -> bool:
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return bool(re.match(pattern, email))

@router.post("/signup", response_model=schemas.TokenOut)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Validate email format
    if not is_valid_email(user.email):
        raise HTTPException(
            status_code=400,
            detail="Invalid email address. Please use format like rahul@gmail.com"
        )
    # Validate name
    if not user.name or len(user.name.strip()) < 2:
        raise HTTPException(
            status_code=400,
            detail="Name must be at least 2 characters"
        )
    # Validate password length
    if len(user.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters"
        )
    # Check if email already exists
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered. Please login instead."
        )
    hashed  = get_password_hash(user.password)
    new_user = models.User(
        name=user.name.strip(),
        email=user.email.lower().strip(),
        hashed_password=hashed
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    token = create_access_token({"user_id": new_user.id})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user":         new_user
    }

@router.post("/login", response_model=schemas.TokenOut)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):    # Validate email format
    if not is_valid_email(user.email):
        raise HTTPException(
            status_code=400,
            detail="Invalid email address format"
        )
    # Find user
    db_user = db.query(models.User).filter(
        models.User.email == user.email.lower().strip()
    ).first()
    # Wrong email or password
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password. Please try again."
        )
    token = create_access_token({"user_id": db_user.id})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user":         db_user
    }

@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user



@router.put("/profile", response_model=schemas.UserOut)
def update_profile(
    data: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if data.name is not None:
        if len(data.name.strip()) < 2:
            raise HTTPException(400, "Name must be at least 2 characters")
        current_user.name = data.name.strip()

    if data.email is not None:
        if not is_valid_email(data.email):
            raise HTTPException(400, "Invalid email address")
        existing = db.query(models.User).filter(
            models.User.email == data.email.lower(),
            models.User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(400, "Email already in use")
        current_user.email = data.email.lower().strip()

    if data.new_password:
        if not data.current_password:
            raise HTTPException(400, "Current password is required to set a new password")
        if not verify_password(data.current_password, current_user.hashed_password):
            raise HTTPException(400, "Current password is incorrect")
        if len(data.new_password) < 6:
            raise HTTPException(400, "New password must be at least 6 characters")
        current_user.hashed_password = get_password_hash(data.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user
