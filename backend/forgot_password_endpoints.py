from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import get_password_hash
import re
from datetime import datetime, timedelta
import string, random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/auth/forgot", tags=["forgot-password"])


def is_valid_email(email: str) -> bool:
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return bool(re.match(pattern, email))


@router.post("/password")
def forgot_password(data: dict, db: Session = Depends(get_db)):
    email_str = data.get("email", "")
    if not is_valid_email(email_str):
        raise HTTPException(status_code=400, detail="Invalid email")

    user = db.query(models.User).filter(
        models.User.email == email_str.lower().strip()
    ).first()
    if not user:
        # Don't reveal whether email exists — but still return 200-style message
        return {"message": "If that email is registered, an OTP has been sent."}

    # Generate OTP
    otp     = ''.join(random.choices(string.digits, k=6))
    expires = datetime.now() + timedelta(minutes=10)

    user.otp          = otp
    user.otp_expires  = expires
    user.otp_verified = False   # reset any previous verification
    db.commit()

    # Send email
    sender   = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_PASS")
    if not sender or not password:
        raise HTTPException(status_code=500, detail="Email config missing in .env (EMAIL_USER / EMAIL_PASS)")

    try:
        msg = MIMEMultipart()
        msg["From"]    = sender
        msg["To"]      = email_str
        msg["Subject"] = "MoneyMap Password Reset — Your OTP"
        msg.attach(MIMEText(f"""
            <h2>Password Reset OTP</h2>
            <p>Your OTP is <strong style="font-size:28px;letter-spacing:4px">{otp}</strong></p>
            <p>Valid for <strong>10 minutes</strong>. Ignore if you didn't request this.</p>
            <p>— Team MoneyMap</p>
        """, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender, password)
            server.sendmail(sender, email_str, msg.as_string())

        print(f"[OTP] Sent {otp} → {email_str}")
    except Exception as e:
        print(f"[Email error] {e}")
        raise HTTPException(status_code=500, detail="Failed to send OTP. Check Gmail App Password in .env")

    return {"message": "OTP sent! Check your inbox/spam."}


@router.post("/verify-otp")
def verify_otp(data: dict, db: Session = Depends(get_db)):
    email = data.get("email", "")
    otp   = data.get("otp", "")

    if not is_valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email")
    if not otp or len(otp) != 6 or not otp.isdigit():
        raise HTTPException(status_code=400, detail="OTP must be 6 digits")

    user = db.query(models.User).filter(
        models.User.email == email.lower().strip()
    ).first()

    if not user or user.otp != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if not user.otp_expires or user.otp_expires < datetime.now():
        raise HTTPException(status_code=400, detail="OTP has expired. Request a new one.")

    # Mark OTP as verified — don't clear yet, set-password checks this flag
    user.otp_verified = True
    db.commit()

    return {"message": "OTP verified! You can now set a new password."}


@router.post("/set-password")
def set_password(data: dict, db: Session = Depends(get_db)):
    email        = data.get("email", "")
    new_password = data.get("password", "")

    if not is_valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user = db.query(models.User).filter(
        models.User.email == email.lower().strip()
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    # Security check: OTP must have been verified in this session
    if not user.otp_verified:
        raise HTTPException(
            status_code=403,
            detail="OTP not verified. Complete /verify-otp before setting a new password."
        )

    user.hashed_password = get_password_hash(new_password)
    user.otp             = ""
    user.otp_expires     = None
    user.otp_verified    = False   # clear flag after use
    db.commit()

    return {"message": "Password reset complete! You can now log in."}