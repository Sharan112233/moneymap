from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import date
import models, schemas
from database import get_db
from auth import get_current_user
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/alerts", tags=["alerts"])


def send_email_alert(to_email: str, subject: str, body: str):
    try:
        sender   = os.getenv("EMAIL_USER")
        password = os.getenv("EMAIL_PASS")
        if not sender or not password:
            print("Email credentials missing in .env")
            return
        msg = MIMEMultipart()
        msg["From"]    = sender
        msg["To"]      = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender, password)
            server.sendmail(sender, to_email, msg.as_string())
        print(f"[Alert] Email sent to {to_email}")
    except Exception as e:
        print(f"[Alert] Email error: {e}")


@router.post("/email-setup", response_model=schemas.EmailAlertOut)
def setup_email(
    data: schemas.EmailAlertCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.EmailAlert).filter(
        models.EmailAlert.user_id == current_user.id
    ).first()

    if existing:
        existing.email   = data.email
        existing.enabled = data.enabled
        db.commit()
        db.refresh(existing)
        return existing

    obj = models.EmailAlert(
        email=data.email,
        enabled=data.enabled,
        user_id=current_user.id
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/email-setup", response_model=schemas.EmailAlertOut)
def get_email_setup(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    config = db.query(models.EmailAlert).filter(
        models.EmailAlert.user_id == current_user.id
    ).first()
    if not config:
        raise HTTPException(status_code=404, detail="No email alert configured")
    return config


@router.get("/check-budgets")
def check_budget_alerts(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    today        = date.today()
    budgets      = db.query(models.Budget).filter(models.Budget.user_id == current_user.id).all()
    alert_config = db.query(models.EmailAlert).filter(models.EmailAlert.user_id == current_user.id).first()

    current_month_expenses = db.query(
        models.Transaction.category,
        func.sum(models.Transaction.amount).label("total")
    ).filter(
        models.Transaction.user_id  == current_user.id,
        models.Transaction.txn_type == "expense",
        func.strftime("%Y", models.Transaction.date) == str(today.year),
        func.strftime("%m", models.Transaction.date) == str(today.month).zfill(2)
    ).group_by(models.Transaction.category).all()

    cat_spent = {row.category: round(row.total, 2) for row in current_month_expenses}

    alerts = []
    for b in budgets:
        spent = cat_spent.get(b.category, 0)
        pct   = round(spent / b.amount * 100, 1) if b.amount else 0
        if pct >= 80:
            status = "exceeded" if pct >= 100 else "warning"
            alerts.append({
                "category":   b.category,
                "budget":     b.amount,
                "spent":      spent,
                "percentage": pct,
                "status":     status
            })
            if alert_config and alert_config.enabled:
                subject = f"MoneyMap Alert: {b.category} budget at {pct}%"
                body    = (
                    f"<h2>Budget Alert</h2>"
                    f"<p><strong>{b.category}</strong> is at <strong>{pct}%</strong></p>"
                    f"<p>Spent: ₹{spent:,.2f} of ₹{b.amount:,.2f}</p>"
                )
                background_tasks.add_task(
                    send_email_alert, alert_config.email, subject, body
                )

    return {"alerts": alerts}


@router.post("/sms-parse")
def parse_sms(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    import re
    sms_text     = data.get("sms", "")
    amount_match = re.search(r'(?:Rs\.?|INR|rs\.?)\s*([\d,]+(?:\.\d{2})?)', sms_text, re.IGNORECASE)
    if not amount_match:
        return {"error": "Could not parse amount from SMS"}

    amount   = float(amount_match.group(1).replace(",", ""))
    txn_type = (
        "income"
        if any(w in sms_text.lower() for w in ["credited", "received", "deposit", "credit"])
        else "expense"
    )

    merchant = "Unknown"
    for pattern in [r'at\s+([A-Z][A-Za-z\s]+)', r'to\s+([A-Z][A-Za-z\s]+)']:
        m = re.search(pattern, sms_text)
        if m:
            merchant = m.group(1).strip()[:30]
            break

    keywords = {
        "Food":          ["swiggy", "zomato", "food", "restaurant", "cafe"],
        "Transport":     ["uber", "ola", "metro", "petrol", "cab"],
        "Shopping":      ["amazon", "flipkart", "myntra", "shop"],
        "Health":        ["pharmacy", "hospital", "medical", "doctor"],
        "Entertainment": ["netflix", "movie", "pvr", "hotstar"],
        "Utilities":     ["electricity", "bill", "internet", "gas"],
        "Rent":          ["rent", "landlord", "apartment"],
    }
    category = "Shopping"
    for cat, words in keywords.items():
        if any(w in sms_text.lower() for w in words):
            category = cat
            break

    txn = models.Transaction(
        description=merchant,
        amount=amount,
        category=category,
        txn_type=txn_type,
        date=date.today(),
        notes="From SMS",
        user_id=current_user.id
    )
    db.add(txn)
    db.commit()

    return {
        "message": "Transaction added from SMS",
        "transaction": {
            "description": merchant,
            "amount":      amount,
            "category":    category,
            "type":        txn_type
        }
    }