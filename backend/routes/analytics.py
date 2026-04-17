from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from database import get_db
from auth import get_current_user
from datetime import date

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    rows = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).all()
    income  = sum(t.amount for t in rows if t.txn_type == "income")
    expense = sum(t.amount for t in rows if t.txn_type == "expense")
    return {
        "total_income": income,
        "total_expense": expense,
        "net_savings": income - expense,
        "savings_rate": round((income - expense) / income * 100, 2) if income else 0
    }

@router.get("/by-category")
def by_category(
    all: bool = False,
    month: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    q = db.query(
        models.Transaction.category,
        func.sum(models.Transaction.amount).label("total")
    ).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.txn_type == "expense"
    )
    if not all:
        if month:
            year, mon = month.split("-")
            q = q.filter(
                func.strftime("%Y", models.Transaction.date) == year,
                func.strftime("%m", models.Transaction.date) == mon.zfill(2)
            )
        else:
            today = date.today()
            q = q.filter(
                func.strftime("%Y", models.Transaction.date) == str(today.year),
                func.strftime("%m", models.Transaction.date) == str(today.month).zfill(2)
            )
    rows = q.group_by(models.Transaction.category).all()
    return [{"category": r.category, "total": round(r.total, 2)} for r in rows]

@router.get("/monthly-trend")
def monthly_trend(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    rows = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).all()
    data = {}
    for t in rows:
        key = t.date.strftime("%Y-%m")
        if key not in data:
            data[key] = {"month": key, "income": 0, "expense": 0}
        if t.txn_type == "income":
            data[key]["income"] += t.amount
        else:
            data[key]["expense"] += t.amount
    return sorted(data.values(), key=lambda x: x["month"])

@router.get("/weekday-pattern")
def weekday_pattern(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    rows = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.txn_type == "expense"
    ).all()
    days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    totals = {d: 0 for d in days}
    counts = {d: 0 for d in days}
    for t in rows:
        day = t.date.strftime("%A")
        totals[day] += t.amount
        counts[day] += 1
    return [{"day": d, "avg": round(totals[d]/counts[d], 2) if counts[d] else 0} for d in days]

@router.get("/current-month-spending")
def current_month_spending(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    today = date.today()
    rows = db.query(
        models.Transaction.category,
        func.sum(models.Transaction.amount).label("total")
    ).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.txn_type == "expense",
        func.strftime("%Y", models.Transaction.date) == str(today.year),
        func.strftime("%m", models.Transaction.date) == str(today.month).zfill(2)
    ).group_by(models.Transaction.category).all()
    return {r.category: round(r.total, 2) for r in rows}