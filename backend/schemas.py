from pydantic import BaseModel
from typing import Optional
from datetime import date


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    created_at: date

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class TransactionCreate(BaseModel):
    description: str
    amount: float
    category: str
    txn_type: str
    date: date
    notes: Optional[str] = ""


class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    amount:      Optional[float] = None
    category:    Optional[str] = None
    txn_type:    Optional[str] = None
    date:        Optional[date] = None
    notes:       Optional[str] = None


class TransactionOut(TransactionCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class BudgetCreate(BaseModel):
    category: str
    amount: float
    month: str


class BudgetOut(BudgetCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class SavingsGoalCreate(BaseModel):
    name:   str
    target: float
    saved:  Optional[float] = 0
    icon:   Optional[str]   = "🎯"


class SavingsGoalOut(SavingsGoalCreate):
    id:         int
    user_id:    int
    created_at: date

    class Config:
        from_attributes = True


class SavingsGoalUpdate(BaseModel):
    saved: float


class ProfileUpdate(BaseModel):
    name:             Optional[str] = None
    email:            Optional[str] = None
    current_password: Optional[str] = None
    new_password:     Optional[str] = None


# ── Email Alert ──────────────────────────────────────────────────────────────

class EmailAlertCreate(BaseModel):
    email:   str
    enabled: bool = True


class EmailAlertOut(EmailAlertCreate):
    id:      int
    user_id: int

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str
    password: str