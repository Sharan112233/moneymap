from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from fpdf import FPDF
import io
from datetime import date
import models
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/pdf")
def generate_pdf(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    rows    = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).all()
    income  = sum(t.amount for t in rows if t.txn_type == "income")
    expense = sum(t.amount for t in rows if t.txn_type == "expense")
    savings = income - expense
    rate    = round(savings / income * 100, 2) if income else 0
    cat_totals = {}
    for t in rows:
        if t.txn_type == "expense":
            cat_totals[t.category] = cat_totals.get(t.category, 0) + t.amount
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", "B", 20)
    pdf.cell(0, 12, "MoneyMap - Financial Report", ln=True, align="C")
    pdf.set_font("Arial", "", 11)
    pdf.cell(0, 8, f"User: {current_user.name} | Generated: {date.today()}", ln=True, align="C")
    pdf.ln(6)
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Summary", ln=True)
    pdf.set_font("Arial", "", 12)
    pdf.cell(0, 8, f"Total Income:   Rs. {income:,.2f}", ln=True)
    pdf.cell(0, 8, f"Total Expenses: Rs. {expense:,.2f}", ln=True)
    pdf.cell(0, 8, f"Net Savings:    Rs. {savings:,.2f}", ln=True)
    pdf.cell(0, 8, f"Savings Rate:   {rate}%", ln=True)
    pdf.ln(4)
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Spending by Category", ln=True)
    pdf.set_font("Arial", "", 12)
    for cat, amt in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True):
        pdf.cell(0, 8, f"  {cat}: Rs. {amt:,.2f}", ln=True)
    pdf.ln(4)
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Recent Transactions", ln=True)
    pdf.set_font("Arial", "B", 10)
    pdf.cell(65, 8, "Description", border=1)
    pdf.cell(30, 8, "Amount", border=1)
    pdf.cell(35, 8, "Category", border=1)
    pdf.cell(25, 8, "Type", border=1)
    pdf.cell(30, 8, "Date", border=1, ln=True)
    pdf.set_font("Arial", "", 10)
    for t in sorted(rows, key=lambda x: x.date, reverse=True)[:20]:
        pdf.cell(65, 7, str(t.description)[:30], border=1)
        pdf.cell(30, 7, f"Rs.{t.amount:,.0f}", border=1)
        pdf.cell(35, 7, str(t.category), border=1)
        pdf.cell(25, 7, str(t.txn_type), border=1)
        pdf.cell(30, 7, str(t.date), border=1, ln=True)
    pdf_bytes = bytes(pdf.output())
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=MoneyMap_{current_user.name}_Report.pdf"}
    )