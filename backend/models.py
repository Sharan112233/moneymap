from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import date

class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String)
    email           = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at      = Column(Date, default=date.today)
    otp             = Column(String, default="")        # for forgot-password flow
    otp_expires     = Column(DateTime, nullable=True)   # expiry of OTP
    otp_verified    = Column(Boolean, default=False)    # set True after /verify-otp, cleared after /set-password
    transactions    = relationship("Transaction", back_populates="owner")
    budgets         = relationship("Budget", back_populates="owner")
    goals           = relationship("SavingsGoal", back_populates="owner")
    email_alerts    = relationship("EmailAlert", back_populates="owner")

class Transaction(Base):
    __tablename__ = "transactions"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"))
    description = Column(String)
    amount      = Column(Float)
    category    = Column(String)
    txn_type    = Column(String)
    date        = Column(Date, default=date.today)
    notes       = Column(String, default="")
    owner       = relationship("User", back_populates="transactions")

class Budget(Base):
    __tablename__ = "budgets"
    id       = Column(Integer, primary_key=True, index=True)
    user_id  = Column(Integer, ForeignKey("users.id"))
    category = Column(String)
    amount   = Column(Float)
    month    = Column(String)
    owner    = relationship("User", back_populates="budgets")

class SavingsGoal(Base):
    __tablename__ = "savings_goals"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"))
    name       = Column(String)
    target     = Column(Float)
    saved      = Column(Float, default=0)
    icon       = Column(String, default="🎯")
    created_at = Column(Date, default=date.today)
    owner      = relationship("User", back_populates="goals")

class EmailAlert(Base):
    __tablename__ = "email_alerts"
    id      = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    email   = Column(String)
    enabled = Column(Boolean, default=True)
    owner   = relationship("User", back_populates="email_alerts")