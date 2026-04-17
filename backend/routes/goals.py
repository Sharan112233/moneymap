from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
import models, schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/goals", tags=["goals"])

@router.get("/", response_model=List[schemas.SavingsGoalOut])
def get_goals(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.SavingsGoal).filter(
        models.SavingsGoal.user_id == current_user.id
    ).all()

@router.post("/", response_model=schemas.SavingsGoalOut)
def create_goal(
    goal: schemas.SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Validate name
    if not goal.name or len(goal.name.strip()) < 2:
        raise HTTPException(400, "Goal name must be at least 2 characters")
    if len(goal.name) > 50:
        raise HTTPException(400, "Goal name cannot exceed 50 characters")

    # Validate target
    if goal.target <= 0:
        raise HTTPException(400, "Target amount must be greater than 0")
    if goal.target > 100000000:
        raise HTTPException(400, "Target amount is too large")

    # Validate saved amount
    if goal.saved < 0:
        raise HTTPException(400, "Saved amount cannot be negative")
    if goal.saved > goal.target:
        raise HTTPException(400, "Saved amount cannot exceed target amount")

    obj = models.SavingsGoal(
        **goal.model_dump(),
        user_id    = current_user.id,
        created_at = date.today()
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/{goal_id}", response_model=schemas.SavingsGoalOut)
def update_goal(
    goal_id: int,
    update: schemas.SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    obj = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id      == goal_id,
        models.SavingsGoal.user_id == current_user.id
    ).first()
    if not obj:
        raise HTTPException(404, "Goal not found")

    # Validate saved amount
    if update.saved < 0:
        raise HTTPException(400, "Saved amount cannot be negative")

    obj.saved = update.saved
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    obj = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id      == goal_id,
        models.SavingsGoal.user_id == current_user.id
    ).first()
    if not obj:
        raise HTTPException(404, "Goal not found")
    db.delete(obj)
    db.commit()
    return {"message": "Goal deleted"}