from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/budget", tags=["budget"])

ALLOWED_CATS = [
    "Food","Transport","Entertainment",
    "Health","Shopping","Utilities","Rent"
]

@router.get("/", response_model=List[schemas.BudgetOut])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Budget).filter(
        models.Budget.user_id == current_user.id
    ).all()

@router.post("/", response_model=schemas.BudgetOut)
def set_budget(
    b: schemas.BudgetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Validate category
    if b.category not in ALLOWED_CATS:
        raise HTTPException(400, f"Invalid category. Allowed: {', '.join(ALLOWED_CATS)}")

    # Validate amount
    if b.amount <= 0:
        raise HTTPException(400, "Budget amount must be greater than 0")
    if b.amount > 10000000:
        raise HTTPException(400, "Budget amount seems too large")

    existing = db.query(models.Budget).filter(
        models.Budget.user_id   == current_user.id,
        models.Budget.category  == b.category,
        models.Budget.month     == b.month
    ).first()
    if existing:
        existing.amount = b.amount
        db.commit()
        db.refresh(existing)
        return existing
    obj = models.Budget(**b.model_dump(), user_id=current_user.id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj