from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import date, timedelta
import models
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/ml", tags=["ml"])


@router.get("/forecast")
def forecast_savings(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    rows = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == current_user.id)
        .all()
    )
    monthly = {}
    for t in rows:
        key = t.date.strftime("%Y-%m")
        monthly.setdefault(key, {"income": 0, "expense": 0})
        if t.txn_type == "income":
            monthly[key]["income"] += t.amount
        else:
            monthly[key]["expense"] += t.amount
    sorted_months = sorted(monthly.keys())
    savings = [monthly[m]["income"] - monthly[m]["expense"] for m in sorted_months]
    if len(savings) < 2:
        return {"historical": [], "forecast": [], "message": "Add more transactions"}
    X = np.array(range(len(savings))).reshape(-1, 1)
    y = np.array(savings)
    model = LinearRegression()
    model.fit(X, y)
    forecast = []
    last_date = date.fromisoformat(sorted_months[-1] + "-01")
    for i in range(1, 7):
        pred_month = (last_date + timedelta(days=32 * i)).replace(day=1)
        pred_val = model.predict([[len(savings) + i - 1]])[0]
        forecast.append(
            {
                "month": pred_month.strftime("%Y-%m"),
                "predicted_savings": round(float(pred_val), 2),
            }
        )
    return {
        "historical": [
            {"month": m, "savings": s} for m, s in zip(sorted_months, savings)
        ],
        "forecast": forecast,
    }


@router.get("/forecast-by-category")
def forecast_by_category(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    rows = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.user_id == current_user.id,
            models.Transaction.txn_type == "expense",
        )
        .all()
    )
    cat_monthly = {}
    for t in rows:
        key = t.date.strftime("%Y-%m")
        cat = t.category
        cat_monthly.setdefault(cat, {})
        cat_monthly[cat].setdefault(key, 0)
        cat_monthly[cat][key] += t.amount
    result = {}
    for cat, monthly in cat_monthly.items():
        sorted_months = sorted(monthly.keys())
        values = [monthly[m] for m in sorted_months]
        if len(values) < 2:
            result[cat] = {"message": "Not enough data"}
            continue
        X = np.array(range(len(values))).reshape(-1, 1)
        y = np.array(values)
        model = LinearRegression()
        model.fit(X, y)
        next_pred = model.predict([[len(values)]])[0]
        result[cat] = {
            "historical": [
                {"month": m, "amount": v} for m, v in zip(sorted_months, values)
            ],
            "next_month_predicted": round(float(max(0, next_pred)), 2),
            "trend": "increasing" if model.coef_[0] > 0 else "decreasing",
        }
    return result


@router.get("/savings-goal-predictor/{goal_id}")
def predict_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    goal = (
        db.query(models.SavingsGoal)
        .filter(
            models.SavingsGoal.id == goal_id,
            models.SavingsGoal.user_id == current_user.id,
        )
        .first()
    )
    if not goal:
        return {"error": "Goal not found"}
    rows = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == current_user.id)
        .all()
    )
    monthly = {}
    for t in rows:
        key = t.date.strftime("%Y-%m")
        monthly.setdefault(key, {"income": 0, "expense": 0})
        if t.txn_type == "income":
            monthly[key]["income"] += t.amount
        else:
            monthly[key]["expense"] += t.amount
    sorted_months = sorted(monthly.keys())
    savings = [monthly[m]["income"] - monthly[m]["expense"] for m in sorted_months]
    if not savings:
        return {"error": "No transaction data"}
    avg_monthly_savings = np.mean(savings)
    remaining = goal.target - goal.saved
    if avg_monthly_savings <= 0:
        return {
            "goal_name": goal.name,
            "target": goal.target,
            "saved": goal.saved,
            "remaining": remaining,
            "months_needed": None,
            "message": "Increase your savings to reach this goal",
        }
    months_needed = remaining / avg_monthly_savings
    target_date = (date.today() + timedelta(days=30 * months_needed)).strftime("%B %Y")
    return {
        "goal_name": goal.name,
        "target": goal.target,
        "saved": goal.saved,
        "remaining": round(remaining, 2),
        "avg_monthly_savings": round(float(avg_monthly_savings), 2),
        "months_needed": round(months_needed, 1),
        "predicted_completion": target_date,
    }


@router.get("/anomalies")
def detect_anomalies(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    rows = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.user_id == current_user.id,
            models.Transaction.txn_type == "expense",
        )
        .all()
    )
    if not rows:
        return {"anomalies": []}
    amounts = np.array([t.amount for t in rows])
    mean = np.mean(amounts)
    std = np.std(amounts)
    anomalies = []
    for t in rows:
        z = (t.amount - mean) / std if std else 0
        if abs(z) > 1.5:
            anomalies.append(
                {
                    "id": t.id,
                    "description": t.description,
                    "amount": t.amount,
                    "category": t.category,
                    "date": str(t.date),
                    "z_score": round(float(z), 2),
                }
            )
    return {
        "anomalies": sorted(anomalies, key=lambda x: abs(x["z_score"]), reverse=True)[:5]
    }


@router.get("/predict-month-end")
def predict_month_end(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    today = date.today()
    start = today.replace(day=1)
    rows = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.user_id == current_user.id,
            models.Transaction.txn_type == "expense",
            models.Transaction.date >= start,
        )
        .all()
    )
    if not rows:
        return {
            "predicted_total": 0,
            "spent_so_far": 0,
            "days_passed": 0,
            "daily_avg": 0,
        }
    days_passed = (today - start).days + 1
    spent = sum(t.amount for t in rows)
    daily_avg = spent / days_passed
    return {
        "spent_so_far": round(spent, 2),
        "days_passed": days_passed,
        "daily_avg": round(daily_avg, 2),
        "predicted_total": round(daily_avg * 30, 2),
    }


@router.get("/smart-budget-plan")
def smart_budget_plan(
    goal_name: str,
    goal_cost: float,
    months: int,
    already_saved: float = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if goal_cost <= 0:
        raise HTTPException(400, "Goal cost must be greater than 0")
    if months <= 0 or months > 60:
        raise HTTPException(400, "Months must be between 1 and 60")
    if already_saved < 0:
        raise HTTPException(400, "Already saved cannot be negative")
    if already_saved >= goal_cost:
        raise HTTPException(400, "You have already saved enough for this goal")

    rows = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == current_user.id)
        .all()
    )

    if not rows:
        raise HTTPException(
            400, "No transaction data found. Add at least 1 month of transactions first."
        )

    monthly_data = {}
    for t in rows:
        key = t.date.strftime("%Y-%m")
        monthly_data.setdefault(key, {"income": 0.0, "expense": 0.0})
        if t.txn_type == "income":
            monthly_data[key]["income"] += float(t.amount)
        else:
            monthly_data[key]["expense"] += float(t.amount)

    sorted_months = sorted(monthly_data.keys(), reverse=True)
    recent_months = sorted_months[:3]

    avg_income = float(np.mean([monthly_data[m]["income"] for m in recent_months]))
    avg_expense = float(np.mean([monthly_data[m]["expense"] for m in recent_months]))
    avg_savings = float(avg_income - avg_expense)

    remaining_needed = float(goal_cost - already_saved)
    monthly_savings_needed = float(remaining_needed / months)
    max_allowed_expense = float(avg_income - monthly_savings_needed)

    is_feasible = bool(monthly_savings_needed <= avg_savings)
    min_months_needed = None
    if not is_feasible and avg_savings > 0:
        min_months_needed = int(np.ceil(remaining_needed / avg_savings))

    FIXED_CATS = ["Rent"]
    VARIABLE_CATS = ["Food", "Shopping", "Entertainment", "Transport", "Utilities", "Health"]
    ALL_BUDGET_CATS = FIXED_CATS + VARIABLE_CATS

    cat_monthly_totals = {cat: {} for cat in ALL_BUDGET_CATS}
    for t in rows:
        if t.txn_type == "expense" and t.date.strftime("%Y-%m") in recent_months:
            cat = t.category
            if cat in ALL_BUDGET_CATS:
                m = t.date.strftime("%Y-%m")
                cat_monthly_totals.setdefault(cat, {})
                cat_monthly_totals[cat][m] = cat_monthly_totals[cat].get(m, 0.0) + float(t.amount)

    cat_averages = {cat: 0.0 for cat in ALL_BUDGET_CATS}
    for cat in ALL_BUDGET_CATS:
        monthly_vals = list(cat_monthly_totals.get(cat, {}).values())
        if monthly_vals:
            cat_averages[cat] = float(round(np.mean(monthly_vals), 2))

    fixed_total = sum(cat_averages.get(cat, 0.0) for cat in FIXED_CATS)
    variable_total = sum(cat_averages.get(cat, 0.0) for cat in VARIABLE_CATS)
    
    suggested_budgets = {}
    already_saves_enough = bool(avg_savings >= monthly_savings_needed)

    if already_saves_enough:
        for cat in ALL_BUDGET_CATS:
            avg = cat_averages.get(cat, 0.0)
            if avg > 0:
                suggested_budgets[cat] = {
                    "current_avg": float(avg),
                    "suggested": float(avg),
                    "change": 0.0,
                    "is_fixed": cat in FIXED_CATS,
                    "icon": "🔒" if cat in FIXED_CATS else "→",
                }
    else:
        variable_budget_available = float(max(0.0, max_allowed_expense - fixed_total))
        for cat in FIXED_CATS:
            avg = cat_averages.get(cat, 0.0)
            if avg > 0:
                suggested_budgets[cat] = {
                    "current_avg": float(avg), "suggested": float(avg),
                    "change": 0.0, "is_fixed": True, "icon": "🔒"
                }
        CAT_FLOORS = {
            "Food":          max(float(round(cat_averages.get("Food",          0) * 0.35, 2)), 1500.0),
            "Transport":     max(float(round(cat_averages.get("Transport",     0) * 0.35, 2)), 300.0),
            "Utilities":     max(float(round(cat_averages.get("Utilities",     0) * 0.35, 2)), 300.0),
            "Health":        max(float(round(cat_averages.get("Health",        0) * 0.35, 2)), 200.0),
            "Shopping":      float(round(cat_averages.get("Shopping",      0) * 0.35, 2)),
            "Entertainment": float(round(cat_averages.get("Entertainment", 0) * 0.35, 2)),
        }
        for cat in VARIABLE_CATS:
            avg = cat_averages.get(cat, 0.0)
            if avg > 0:
                proportion = float(avg) / float(variable_total) if variable_total > 0 else 0
                proportional = float(round(proportion * variable_budget_available, 2))
                floor = CAT_FLOORS.get(cat, 0.0)
                suggested = float(max(proportional, floor))
                change = float(round(suggested - avg, 2))
                suggested_budgets[cat] = {
                    "current_avg": float(avg),
                    "suggested": suggested,
                    "change": change,
                    "is_fixed": False,
                    "icon": "↓" if change < -1 else ("↑" if change > 1 else "→"),
                }
    today = date.today()
    total_months = today.month + months
    target_year = today.year + (total_months - 1) // 12
    target_month = ((total_months - 1) % 12) + 1
    target_date_str = date(target_year, target_month, 1).strftime("%B %Y")

    existing_goals = db.query(models.SavingsGoal).filter(models.SavingsGoal.user_id == current_user.id).all()
    other_goals_monthly = 0.0
    conflicting_goals = []
    for g in existing_goals:
        if g.target > g.saved:
            needed = float((g.target - g.saved) / 6)
            other_goals_monthly += needed
            conflicting_goals.append({"name": str(g.name), "monthly_needed": float(round(needed, 2))})

    combined_monthly_needed = float(monthly_savings_needed + other_goals_monthly)
    has_conflict = bool(combined_monthly_needed > avg_savings)
    conflict_info = None
    if has_conflict and conflicting_goals:
        shortfall = float(round(combined_monthly_needed - avg_savings, 2))
        conflict_info = {
            "detected": True,
            "shortfall": shortfall,
            "combined_needed": float(round(combined_monthly_needed, 2)),
            "max_capacity": float(round(avg_savings, 2)),
            "conflicting_goals": conflicting_goals,
            "options": [
                f"Delay '{goal_name}' by {max(1, int(np.ceil(shortfall / max(1, avg_savings / max(1, months)))))} months",
                f"Reduce goal cost by Rs.{round(shortfall * months, 0):,.0f}",
                
            ],
        }

    return {
        "goal_name": str(goal_name),
        "already_saves_enough": bool(already_saves_enough),
        "goal_cost": float(goal_cost),
        "already_saved": float(already_saved),
        "remaining_needed": float(round(remaining_needed, 2)),
        "months": int(months),
        "monthly_savings_needed": float(round(monthly_savings_needed, 2)),
        "avg_monthly_income": float(round(avg_income, 2)),
        "avg_monthly_expense": float(round(avg_expense, 2)),
        "avg_monthly_savings": float(round(avg_savings, 2)),
        "max_allowed_expense": float(round(max_allowed_expense, 2)),
        "target_date": str(target_date_str),
        "is_feasible": bool(is_feasible),
        "min_months_needed": int(min_months_needed) if min_months_needed else None,
        "suggested_budgets": suggested_budgets,
        "conflict": conflict_info,
        "data_based_on_months": int(len(recent_months)),
    }


@router.get("/smart-insights")
def smart_insights(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    rows = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == current_user.id)
        .all()
    )
    if not rows:
        return {"insights": []}
    
    expenses = [t for t in rows if t.txn_type == "expense"]
    incomes = [t for t in rows if t.txn_type == "income"]
    total_income = sum(t.amount for t in incomes)
    total_expense = sum(t.amount for t in expenses)
    savings_rate = (((total_income - total_expense) / total_income * 100) if total_income else 0)
    
    cat_totals = {}
    for t in expenses:
        cat_totals[t.category] = cat_totals.get(t.category, 0) + t.amount
    
    top_cat = max(cat_totals, key=cat_totals.get) if cat_totals else None
    top_amount = cat_totals.get(top_cat, 0)
    top_pct = (top_amount / total_expense * 100) if total_expense else 0
    
    day_totals, day_counts = {}, {}
    for t in expenses:
        day = t.date.strftime("%A")
        day_totals[day] = day_totals.get(day, 0) + t.amount
        day_counts[day] = day_counts.get(day, 0) + 1
    
    day_avgs = {d: day_totals[d] / day_counts[d] for d in day_totals}
    top_day = max(day_avgs, key=day_avgs.get) if day_avgs else None
    
    amounts = [t.amount for t in expenses]
    mean_amt = np.mean(amounts) if amounts else 0
    std_amt = np.std(amounts) if amounts else 0
    anomaly_count = sum(1 for a in amounts if abs(a - mean_amt) > 1.5 * std_amt)
    
    insights = []
    if savings_rate >= 20:
        insights.append({
            "type": "success", "icon": " ", "title": "Great savings rate!",
            "text": f"You are saving {savings_rate:.1f}% of your income. Keep it up!"
        })
    else:
        insights.append({
            "type": "warning", "icon": "⚠️", "title": "Low savings rate",
            "text": f"Your savings rate is {savings_rate:.1f}%. Try to reach 20% by cutting spending."
        })
    
    if top_cat:
        insights.append({
            "type": "info", "icon": "📊", "title": f"Top spending: {top_cat}",
            "text": f"{top_cat} is your biggest expense at ₹{top_amount:,.0f} ({top_pct:.1f}%)."
        })
    
    if top_day:
        insights.append({
            "type": "info", "icon": "📅", "title": f"You spend most on {top_day}s",
            "text": f"Average spending on {top_day} is ₹{day_avgs[top_day]:,.0f}."
        })
    
    if anomaly_count > 0:
        insights.append({
            "type": "danger", "icon": "🚨", "title": "Unusual transactions detected",
            "text": f"{anomaly_count} transaction(s) are significantly higher than average."
        })

    monthly_data = {}
    for t in rows:
        key = t.date.strftime("%Y-%m")
        monthly_data.setdefault(key, {"income": 0, "expense": 0})
        if t.txn_type == "income":
            monthly_data[key]["income"] += t.amount
        else:
            monthly_data[key]["expense"] += t.amount

    if monthly_data:
        monthly_savings_list = [v["income"] - v["expense"] for v in monthly_data.values()]
        avg_monthly_savings = sum(monthly_savings_list) / len(monthly_savings_list)
        insights.append({
            "type": "info", "icon": "💰", "title": "Monthly savings estimate",
            "text": f"On average you save ₹{avg_monthly_savings:,.0f}/month."
        })
        
    return {"insights": insights}