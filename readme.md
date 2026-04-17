# 💰 MoneyMap

A full-stack personal finance tracker built with **React + FastAPI + scikit-learn**. Track your income and expenses, get ML-powered savings forecasts, set budgets with smart alerts, and manage savings goals — all in a clean, dark-themed dashboard.

---

## ✨ Features

### 💳 Transaction Management
- Add, edit, delete income and expense transactions
- Filter by category, date range, type (income/expense)
- Search transactions by description
- Duplicate transaction detection
- Bulk delete and CSV import from bank statements
- Pagination for large datasets

### 📊 Analytics & Charts
- Monthly income vs expense bar chart
- Cumulative savings line chart over time
- Spending heatmap — month × category
- Category-wise breakdown (all time or per month)

### 🎯 Budget Manager
- Set monthly budgets per category
- Visual budget bars showing spent vs remaining
- Smart Budget Planner — enter a goal (e.g. "buy a laptop in 3 months") and get AI-suggested budgets
- Feasibility check and conflict detection with existing goals

### 🤖 ML-Powered Forecast
- 6-month savings forecast using **Linear Regression** (scikit-learn)
- Per-category spending forecast for next month
- Month-end spending prediction based on current pace
- Savings goal ML predictor — estimates completion date

### 🎯 Savings Goals
- Create goals with target amount, current savings, and emoji icon
- Progress bars with percentage tracking
- ML prediction for each goal's estimated completion date
- Add savings incrementally to any goal

### ✨ AI Insights
- Smart insights generated from your real spending patterns
- Anomaly detection using Z-score analysis
- Budget alerts when spending crosses 80% of limit
- Bank SMS parser — paste an SMS to auto-add a transaction
- Email budget alerts via Gmail SMTP

### 📄 Reports
- Download full financial report as PDF

### 🔐 Auth & Security
- JWT-based authentication (signup / login / logout)
- Password reset via OTP email (forgot password flow)
- Protected routes — all data is per-user and private

### 🎤 Voice Commands
- Navigate between pages by voice
- Ask for spending summaries hands-free
- Works with Web Speech API (Chrome/Edge)

### 🌗 UI/UX
- Dark and light theme toggle
- Fully responsive — works on mobile, tablet, and desktop
- Mobile: hamburger drawer sidebar + bottom navigation bar
- Skeleton loaders while data is fetching
- Animated metric cards with count-up effect

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP Client | Axios |
| Backend | FastAPI (Python) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | SQLAlchemy |
| Auth | JWT (python-jose), bcrypt (passlib) |
| ML | scikit-learn (LinearRegression) |
| Email | Gmail SMTP (smtplib) |
| PDF | ReportLab |

---

## 📁 Project Structure

```
moneymap/
├── backend/
│   ├── main.py                        # FastAPI app entry point
│   ├── models.py                      # SQLAlchemy database models
│   ├── schemas.py                     # Pydantic request/response schemas
│   ├── database.py                    # DB engine and session
│   ├── auth.py                        # JWT token logic
│   ├── forgot_password_endpoints.py   # OTP-based password reset
│   ├── requirements.txt
│   └── routes/
│       ├── auth_routes.py             # Signup, login, profile
│       ├── transactions.py            # CRUD + CSV import
│       ├── budget.py                  # Budget management
│       ├── analytics.py              # Charts and summary data
│       ├── ml.py                      # Forecast, anomaly, insights
│       ├── goals.py                   # Savings goals
│       ├── alerts.py                  # Email alerts, SMS parser
│       └── reports.py                 # PDF generation
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js              # Axios instance + all API calls
    │   ├── components/
    │   │   ├── Sidebar.jsx            # Responsive sidebar + bottom nav
    │   │   ├── MetricCard.jsx
    │   │   ├── TransactionItem.jsx
    │   │   ├── BudgetBar.jsx
    │   │   ├── VoiceCommand.jsx
    │   │   ├── EmptyState.jsx
    │   │   └── SkeletonCard.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── ForgotPassword.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Transactions.jsx
    │   │   ├── Analytics.jsx
    │   │   ├── Budget.jsx
    │   │   ├── Forecast.jsx
    │   │   ├── Insights.jsx
    │   │   ├── Reports.jsx
    │   │   └── Profile.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## ⚙️ Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Gmail account with App Password enabled

---

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/moneymap.git
cd moneymap
```

---

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:

```env
SECRET_KEY=your_secret_key_here
DATABASE_URL=sqlite:///./moneymap.db
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

> **How to get Gmail App Password:**
> Google Account → Security → 2-Step Verification → App Passwords → Generate

Start the backend:

```bash
python -m uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🌐 Deployment

| Service | Purpose | Free Tier |
|---|---|---|
| Vercel | Frontend (React) |   Forever free |
| Render | Backend (FastAPI) |   Free (sleeps after inactivity) |
| Render PostgreSQL | Production database |   Free tier |

> For production, switch `DATABASE_URL` from SQLite to your Render PostgreSQL URL and remove `connect_args={"check_same_thread": False}` from `database.py`.

---

## 📸 Screenshots

> Add screenshots here after deployment

---

## 🔮 Roadmap

- [ ] Recurring transactions (auto-add monthly bills)
- [ ] Export to Excel / CSV
- [ ] In-app notification center
- [ ] Bill reminders with due date tracking
- [ ] Net worth tracker (assets vs liabilities)
- [ ] WhatsApp / Telegram bot integration
- [ ] AI chat assistant ("how much did I spend on food last month?")
- [ ] Multi-currency support

---

## 👨‍💻 Author

Built by **Sharanabasappa Udanoore**

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).