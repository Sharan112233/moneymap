from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
import models, schemas
from database import get_db
from auth import get_current_user
import pandas as pd
import numpy as np
import io
import re
from dateutil import parser as date_parser
router = APIRouter(prefix="/transactions", tags=["transactions"])

ALLOWED_EXPENSE_CATS = [
    "Food","Transport","Entertainment",
    "Health","Shopping","Utilities","Rent"
]
ALLOWED_INCOME_CATS = [
    "Salary","Freelance","Business",
    "Investment","Other Income"
]
ALL_CATS = ALLOWED_EXPENSE_CATS + ALLOWED_INCOME_CATS

def validate_transaction(txn):
    # Validate description
    if not txn.description or len(txn.description.strip()) < 2:
        raise HTTPException(400, "Description must be at least 2 characters")
    if len(txn.description) > 100:
        raise HTTPException(400, "Description cannot exceed 100 characters")

    # Validate amount
    if txn.amount is None:
        raise HTTPException(400, "Amount is required")
    if txn.amount <= 0:
        raise HTTPException(400, "Amount must be greater than 0")
    if txn.amount > 10000000:
        raise HTTPException(400, "Amount seems too large. Maximum is 1 crore")

    # Validate category
    if txn.category not in ALL_CATS:
        raise HTTPException(400, f"Invalid category. Allowed: {', '.join(ALL_CATS)}")

    # Validate type
    if txn.txn_type not in ["income", "expense"]:
        raise HTTPException(400, "Type must be either income or expense")

    # Validate date
    if txn.date > date.today() + timedelta(days=1):
        raise HTTPException(400, "Transaction date cannot be in the future")
    if txn.date < date(2000, 1, 1):
        raise HTTPException(400, "Transaction date is too old")

    # Validate notes
    if txn.notes and len(txn.notes) > 200:
        raise HTTPException(400, "Notes cannot exceed 200 characters")

@router.get("/", response_model=List[schemas.TransactionOut])
def get_transactions(
    category:   Optional[str] = None,
    search:     Optional[str] = None,
    sort_by:    Optional[str] = "date",
    sort_order: Optional[str] = "desc",
    txn_type:   Optional[str] = None,
    from_date:  Optional[date] = None,
    to_date:    Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    q = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id
    )
    if category:
        if category not in ALL_CATS:
            raise HTTPException(400, "Invalid category filter")
        q = q.filter(models.Transaction.category == category)
    if txn_type in ["income", "expense"]:
        q = q.filter(models.Transaction.txn_type == txn_type)
    if from_date:
        q = q.filter(models.Transaction.date >= from_date)
    if to_date:
        q = q.filter(models.Transaction.date <= to_date)
    if search:
        if len(search) > 50:
            raise HTTPException(400, "Search term too long")
        q = q.filter(models.Transaction.description.ilike(f"%{search}%"))
    if sort_by == "amount":
        q = q.order_by(
            models.Transaction.amount.desc()
            if sort_order == "desc"
            else models.Transaction.amount.asc()
        )
    elif sort_by == "category":
        q = q.order_by(models.Transaction.category.asc())
    else:
        q = q.order_by(
            models.Transaction.date.desc()
            if sort_order == "desc"
            else models.Transaction.date.asc()
        )
    return q.all()

@router.post("/", response_model=schemas.TransactionOut)
def create_transaction(
    txn: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    validate_transaction(txn)
    obj = models.Transaction(**txn.model_dump(), user_id=current_user.id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/{txn_id}", response_model=schemas.TransactionOut)
def update_transaction(
    txn_id: int,
    txn: schemas.TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    obj = db.query(models.Transaction).filter(
        models.Transaction.id == txn_id,
        models.Transaction.user_id == current_user.id
    ).first()
    if not obj:
        raise HTTPException(404, "Transaction not found")

    # Validate fields that are being updated
    if txn.amount is not None and txn.amount <= 0:
        raise HTTPException(400, "Amount must be greater than 0")
    if txn.amount is not None and txn.amount > 10000000:
        raise HTTPException(400, "Amount seems too large")
    if txn.description is not None and len(txn.description.strip()) < 2:
        raise HTTPException(400, "Description must be at least 2 characters")
    if txn.description is not None and len(txn.description) > 100:
        raise HTTPException(400, "Description cannot exceed 100 characters")
    if txn.category is not None and txn.category not in ALL_CATS:
        raise HTTPException(400, "Invalid category")
    if txn.txn_type is not None and txn.txn_type not in ["income", "expense"]:
        raise HTTPException(400, "Type must be income or expense")
    if txn.notes is not None and len(txn.notes) > 200:
        raise HTTPException(400, "Notes cannot exceed 200 characters")

    for key, value in txn.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/all")
def delete_all_transactions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id
    ).delete()
    db.commit()
    return {"message": "All transactions deleted"}

@router.delete("/{txn_id}")
def delete_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    obj = db.query(models.Transaction).filter(
        models.Transaction.id == txn_id,
        models.Transaction.user_id == current_user.id
    ).first()
    if not obj:
        raise HTTPException(404, "Transaction not found")
    db.delete(obj)
    db.commit()
    return {"message": "Deleted successfully"}



ALLOWED_EXPENSE_CATS = [
    "Food","Transport","Entertainment",
    "Health","Shopping","Utilities","Rent"
]
ALLOWED_INCOME_CATS = [
    "Salary","Freelance","Business",
    "Investment","Other Income"
]
ALL_CATS = ALLOWED_EXPENSE_CATS + ALLOWED_INCOME_CATS

CATEGORY_KEYWORDS = {
    "Food":          ["swiggy","zomato","food","restaurant","cafe","pizza","burger","hotel","diner","grocery","bigbazaar","dmart","supermarket","blinkit","instamart"],
    "Transport":     ["uber","ola","metro","petrol","fuel","cab","bus","auto","rapido","redbus","irctc","railway","flight","indigo","spicejet","parking"],
    "Shopping":      ["amazon","flipkart","myntra","meesho","shop","mall","store","market","nykaa","ajio","snapdeal","retail"],
    "Health":        ["pharmacy","hospital","medical","clinic","doctor","apollo","medplus","1mg","netmeds","health","lab","diagnostic"],
    "Entertainment": ["netflix","hotstar","movie","pvr","inox","spotify","bookmyshow","prime","youtube","gaming","disney"],
    "Utilities":     ["electricity","water","gas","internet","broadband","bill","recharge","airtel","jio","bsnl","vodafone","wifi","postpaid"],
    "Rent":          ["rent","landlord","house","apartment","pg","hostel","lease"],
    "Salary":        ["salary","sal","payroll","wages","stipend","ctc"],
    "Freelance":     ["freelance","project","client","consulting","contract"],
    "Investment":    ["mutual fund","sip","stocks","shares","zerodha","groww","investment","fd","fixed deposit","rd"],
}

def auto_categorize(description: str) -> tuple:
    desc_lower = description.lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in desc_lower for keyword in keywords):
            if cat in ALLOWED_INCOME_CATS:
                return cat, "income"
            return cat, "expense"
    return "Shopping", "expense"

def clean_amount(value) -> float:
    if pd.isna(value):
        return None
    cleaned = re.sub(r'[^\d.]', '', str(value))
    if cleaned and cleaned != '.':
        return float(cleaned)
    return None

def clean_date(value) -> date:
    if pd.isna(value) or str(value).strip() == '':
        return None
    try:
        parsed = date_parser.parse(str(value), dayfirst=True)
        return parsed.date()
    except:
        return None

def detect_columns(df: pd.DataFrame) -> dict:
    columns = {col.lower().strip(): col for col in df.columns}

    date_keys   = ['date','transaction date','txn date','value date','posting date','trans date','dated']
    desc_keys   = ['description','narration','details','particulars','remarks','transaction details','beneficiary name','txn description']
    amount_keys = ['amount','transaction amount','txn amount','debit','credit','withdrawal','deposit','withdrawal amt','deposit amt']
    type_keys   = ['type','dr/cr','transaction type','debit/credit','txn type']

    result = {}

    for key in date_keys:
        if key in columns:
            result['date'] = columns[key]
            break

    for key in desc_keys:
        if key in columns:
            result['description'] = columns[key]
            break

    for key in amount_keys:
        if key in columns:
            result['amount'] = columns[key]
            break

    if 'debit' in columns and 'credit' in columns:
        result['debit']  = columns['debit']
        result['credit'] = columns['credit']
        result['split']  = True

    for key in type_keys:
        if key in columns:
            result['type'] = columns[key]
            break

    return result

@router.post("/import-csv")
async def import_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(400, "Please upload a CSV file only")

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8', errors='ignore')))
    except Exception as e:
        raise HTTPException(400, f"Could not read CSV file: {str(e)}")

    if df.empty:
        raise HTTPException(400, "CSV file is empty")

    # Remove completely empty rows
    df = df.dropna(how='all')
    df = df.reset_index(drop=True)

    # Detect column mapping
    col_map = detect_columns(df)

    if 'date' not in col_map:
        raise HTTPException(400, f"Could not find date column. Your columns: {list(df.columns)}")

    if 'amount' not in col_map and 'debit' not in col_map:
        raise HTTPException(400, f"Could not find amount column. Your columns: {list(df.columns)}")

    # Process each row
    success_count   = 0
    skipped_null    = 0
    skipped_invalid = 0
    skipped_duplicate = 0
    skipped_future  = 0
    error_rows      = []
    added_transactions = []

    for index, row in df.iterrows():
        try:
            # Clean date
            txn_date = clean_date(row.get(col_map.get('date', ''), None))
            if not txn_date:
                skipped_null += 1
                error_rows.append(f"Row {index+2}: Invalid or empty date")
                continue

            # Skip future dates
            if txn_date > date.today():
                skipped_future += 1
                continue

            # Skip very old dates
            if txn_date < date(2000, 1, 1):
                skipped_invalid += 1
                continue

            # Clean amount
            amount = None
            txn_type = "expense"

            if col_map.get('split'):
                # Separate debit and credit columns
                debit  = clean_amount(row.get(col_map.get('debit', ''), None))
                credit = clean_amount(row.get(col_map.get('credit', ''), None))
                if debit and debit > 0:
                    amount   = debit
                    txn_type = "expense"
                elif credit and credit > 0:
                    amount   = credit
                    txn_type = "income"
            else:
                amount = clean_amount(row.get(col_map.get('amount', ''), None))
                if amount is None:
                    skipped_null += 1
                    error_rows.append(f"Row {index+2}: Invalid or empty amount")
                    continue

                # Detect type from type column or amount sign
                if 'type' in col_map:
                    type_val = str(row.get(col_map['type'], '')).lower()
                    if any(w in type_val for w in ['credit','cr','deposit','received']):
                        txn_type = "income"
                    else:
                        txn_type = "expense"
                elif amount < 0:
                    txn_type = "expense"
                    amount   = abs(amount)

            if not amount or amount <= 0:
                skipped_null += 1
                continue

            if amount > 10000000:
                skipped_invalid += 1
                continue

            # Clean description
            description = "Unknown Transaction"
            if 'description' in col_map:
                desc_val = str(row.get(col_map['description'], '')).strip()
                if desc_val and desc_val.lower() not in ['nan', 'none', '']:
                    description = desc_val[:100]

            # Auto categorize
            category, detected_type = auto_categorize(description)
            if 'type' not in col_map and not col_map.get('split'):
                txn_type = detected_type

            # Check for duplicates
            existing = db.query(models.Transaction).filter(
                models.Transaction.user_id    == current_user.id,
                models.Transaction.date       == txn_date,
                models.Transaction.amount     == amount,
                models.Transaction.description == description[:50]
            ).first()

            if existing:
                skipped_duplicate += 1
                continue

            # Save transaction
            txn = models.Transaction(
                user_id     = current_user.id,
                description = description,
                amount      = round(amount, 2),
                category    = category,
                txn_type    = txn_type,
                date        = txn_date,
                notes       = "Imported from CSV"
            )
            db.add(txn)
            success_count += 1
            added_transactions.append({
                "description": description,
                "amount":      round(amount, 2),
                "category":    category,
                "type":        txn_type,
                "date":        str(txn_date)
            })

        except Exception as e:
            error_rows.append(f"Row {index+2}: {str(e)}")
            skipped_invalid += 1
            continue

    db.commit()

    return {
        "message":            f"CSV import completed",
        "success_count":      success_count,
        "skipped_null":       skipped_null,
        "skipped_invalid":    skipped_invalid,
        "skipped_duplicate":  skipped_duplicate,
        "skipped_future":     skipped_future,
        "total_rows":         len(df),
        "error_rows":         error_rows[:10],
        "preview":            added_transactions[:5]
    }