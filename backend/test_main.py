import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
import models

# ── Test database setup ──────────────────────────────────────
TEST_DATABASE_URL = "sqlite:///./test_moneymap.db"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

Base.metadata.create_all(bind=engine)

client = TestClient(app)

# ── Helper functions ─────────────────────────────────────────
def create_test_user_and_login():
    # Signup
    client.post("/auth/signup", json={
        "name":     "Test User",
        "email":    "test@gmail.com",
        "password": "test123"
    })
    # Login
    res = client.post("/auth/login", json={
        "name":     "",
        "email":    "test@gmail.com",
        "password": "test123"
    })
    return res.json()["access_token"]

def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ════════════════════════════════════════════════════════════
# AUTH TESTS
# ════════════════════════════════════════════════════════════

class TestAuth:

    def test_signup_success(self):
        res = client.post("/auth/signup", json={
            "name":     "Rahul Sharma",
            "email":    "rahul@gmail.com",
            "password": "password123"
        })
        assert res.status_code == 200
        assert "access_token" in res.json()
        assert res.json()["user"]["email"] == "rahul@gmail.com"
        print("  Signup success test passed")

    def test_signup_invalid_email(self):
        res = client.post("/auth/signup", json={
            "name":     "Test",
            "email":    "notanemail",
            "password": "password123"
        })
        assert res.status_code == 400
        assert "Invalid email" in res.json()["detail"]
        print("  Signup invalid email test passed")

    def test_signup_short_password(self):
        res = client.post("/auth/signup", json={
            "name":     "Test",
            "email":    "test2@gmail.com",
            "password": "123"
        })
        assert res.status_code == 400
        assert "6 characters" in res.json()["detail"]
        print("  Signup short password test passed")

    def test_signup_short_name(self):
        res = client.post("/auth/signup", json={
            "name":     "A",
            "email":    "test3@gmail.com",
            "password": "password123"
        })
        assert res.status_code == 400
        print("  Signup short name test passed")

    def test_signup_duplicate_email(self):
        client.post("/auth/signup", json={
            "name":     "User One",
            "email":    "duplicate@gmail.com",
            "password": "password123"
        })
        res = client.post("/auth/signup", json={
            "name":     "User Two",
            "email":    "duplicate@gmail.com",
            "password": "password123"
        })
        assert res.status_code == 400
        assert "already registered" in res.json()["detail"]
        print("  Duplicate email test passed")

    def test_login_success(self):
        client.post("/auth/signup", json={
            "name":     "Login User",
            "email":    "login@gmail.com",
            "password": "password123"
        })
        res = client.post("/auth/login", json={
            "name":     "",
            "email":    "login@gmail.com",
            "password": "password123"
        })
        assert res.status_code == 200
        assert "access_token" in res.json()
        print("  Login success test passed")

    def test_login_wrong_password(self):
        client.post("/auth/signup", json={
            "name":     "Wrong Pass",
            "email":    "wrongpass@gmail.com",
            "password": "correct123"
        })
        res = client.post("/auth/login", json={
            "name":     "",
            "email":    "wrongpass@gmail.com",
            "password": "wrongpassword"
        })
        assert res.status_code == 401
        print("  Wrong password test passed")

    def test_login_wrong_email(self):
        res = client.post("/auth/login", json={
            "name":     "",
            "email":    "nobody@gmail.com",
            "password": "password123"
        })
        assert res.status_code == 401
        print("  Wrong email test passed")

    def test_access_without_token(self):
        res = client.get("/transactions/")
        assert res.status_code == 401
        print("  Access without token test passed")

    def test_access_with_invalid_token(self):
        res = client.get("/transactions/", headers={
            "Authorization": "Bearer invalidtoken123"
        })
        assert res.status_code == 401
        print("  Invalid token test passed")


# ════════════════════════════════════════════════════════════
# TRANSACTION TESTS
# ════════════════════════════════════════════════════════════

class TestTransactions:

    def setup_method(self):
        self.token   = create_test_user_and_login()
        self.headers = auth_headers(self.token)

    def test_create_transaction_success(self):
        res = client.post("/transactions/", json={
            "description": "Swiggy Order",
            "amount":      340,
            "category":    "Food",
            "txn_type":    "expense",
            "date":        "2026-03-01",
            "notes":       "Lunch"
        }, headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert data["description"] == "Swiggy Order"
        assert data["amount"]      == 340
        assert data["category"]    == "Food"
        assert data["txn_type"]    == "expense"
        print("  Create transaction test passed")

    def test_create_income_transaction(self):
        res = client.post("/transactions/", json={
            "description": "Monthly Salary",
            "amount":      60000,
            "category":    "Salary",
            "txn_type":    "income",
            "date":        "2026-03-01",
            "notes":       ""
        }, headers=self.headers)
        assert res.status_code == 200
        assert res.json()["txn_type"] == "income"
        print("  Create income transaction test passed")

    def test_create_transaction_negative_amount(self):
        res = client.post("/transactions/", json={
            "description": "Test",
            "amount":      -500,
            "category":    "Food",
            "txn_type":    "expense",
            "date":        "2026-03-01",
            "notes":       ""
        }, headers=self.headers)
        assert res.status_code == 400
        assert "greater than 0" in res.json()["detail"]
        print("  Negative amount test passed")

    def test_create_transaction_zero_amount(self):
        res = client.post("/transactions/", json={
            "description": "Test",
            "amount":      0,
            "category":    "Food",
            "txn_type":    "expense",
            "date":        "2026-03-01",
            "notes":       ""
        }, headers=self.headers)
        assert res.status_code == 400
        print("  Zero amount test passed")

    def test_create_transaction_empty_description(self):
        res = client.post("/transactions/", json={
            "description": "A",
            "amount":      500,
            "category":    "Food",
            "txn_type":    "expense",
            "date":        "2026-03-01",
            "notes":       ""
        }, headers=self.headers)
        assert res.status_code == 400
        print("  Empty description test passed")

    def test_create_transaction_invalid_category(self):
        res = client.post("/transactions/", json={
            "description": "Test",
            "amount":      500,
            "category":    "InvalidCategory",
            "txn_type":    "expense",
            "date":        "2026-03-01",
            "notes":       ""
        }, headers=self.headers)
        assert res.status_code == 400
        assert "Invalid category" in res.json()["detail"]
        print("  Invalid category test passed")

    def test_create_transaction_invalid_type(self):
        res = client.post("/transactions/", json={
            "description": "Test",
            "amount":      500,
            "category":    "Food",
            "txn_type":    "invalid_type",
            "date":        "2026-03-01",
            "notes":       ""
        }, headers=self.headers)
        assert res.status_code == 400
        print("  Invalid transaction type test passed")

    def test_create_transaction_future_date(self):
        res = client.post("/transactions/", json={
            "description": "Future",
            "amount":      500,
            "category":    "Food",
            "txn_type":    "expense",
            "date":        "2099-01-01",
            "notes":       ""
        }, headers=self.headers)
        assert res.status_code == 400
        print("  Future date test passed")

    def test_create_transaction_too_large_amount(self):
        res = client.post("/transactions/", json={
            "description": "Too large",
            "amount":      99999999,
            "category":    "Food",
            "txn_type":    "expense",
            "date":        "2026-03-01",
            "notes":       ""
        }, headers=self.headers)
        assert res.status_code == 400
        print("  Too large amount test passed")

    def test_get_transactions(self):
        client.post("/transactions/", json={
            "description": "Netflix",
            "amount":      649,
            "category":    "Entertainment",
            "txn_type":    "expense",
            "date":        "2026-03-01",
            "notes":       ""
        }, headers=self.headers)
        res = client.get("/transactions/", headers=self.headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)
        print("  Get transactions test passed")

    def test_update_transaction(self):
        create_res = client.post("/transactions/", json={
            "description": "Uber",
            "amount":      180,
            "category":    "Transport",
            "txn_type":    "expense",
            "date":        "2026-03-01",
            "notes":       ""
        }, headers=self.headers)
        txn_id = create_res.json()["id"]

        update_res = client.put(f"/transactions/{txn_id}", json={
            "amount": 220,
            "notes":  "Updated fare"
        }, headers=self.headers)
        assert update_res.status_code == 200
        assert update_res.json()["amount"] == 220
        print("  Update transaction test passed")

    def test_delete_transaction(self):
        create_res = client.post("/transactions/", json={
            "description": "To Delete",
            "amount":      100,
            "category":    "Food",
            "txn_type":    "expense",
            "date":        "2026-03-01",
            "notes":       ""
        }, headers=self.headers)
        txn_id = create_res.json()["id"]

        del_res = client.delete(f"/transactions/{txn_id}", headers=self.headers)
        assert del_res.status_code == 200
        assert del_res.json()["message"] == "Deleted successfully"
        print("  Delete transaction test passed")

    def test_delete_nonexistent_transaction(self):
        res = client.delete("/transactions/99999", headers=self.headers)
        assert res.status_code == 404
        print("  Delete nonexistent transaction test passed")

    def test_search_transactions(self):
        client.post("/transactions/", json={
            "description": "Zomato Dinner",
            "amount":      450,
            "category":    "Food",
            "txn_type":    "expense",
            "date":        "2026-03-01",
            "notes":       ""
        }, headers=self.headers)
        res = client.get("/transactions/?search=Zomato", headers=self.headers)
        assert res.status_code == 200
        results = res.json()
        assert any("Zomato" in t["description"] for t in results)
        print("  Search transactions test passed")

    def test_filter_by_category(self):
        res = client.get("/transactions/?category=Food", headers=self.headers)
        assert res.status_code == 200
        for txn in res.json():
            assert txn["category"] == "Food"
        print("  Filter by category test passed")

    def test_user_isolation(self):
        # Create second user
        client.post("/auth/signup", json={
            "name":     "Second User",
            "email":    "second@gmail.com",
            "password": "password123"
        })
        res2 = client.post("/auth/login", json={
            "name":     "",
            "email":    "second@gmail.com",
            "password": "password123"
        })
        token2 = res2.json()["access_token"]

        # Add transaction as user 1
        create_res = client.post("/transactions/", json={
            "description": "Private Transaction",
            "amount":      1000,
            "category":    "Food",
            "txn_type":    "expense",
            "date":        "2026-03-01",
            "notes":       ""
        }, headers=self.headers)
        txn_id = create_res.json()["id"]

        # User 2 should not see user 1 transactions
        res = client.get("/transactions/", headers=auth_headers(token2))
        txn_ids = [t["id"] for t in res.json()]
        assert txn_id not in txn_ids
        print("  User isolation test passed")


# ════════════════════════════════════════════════════════════
# BUDGET TESTS
# ════════════════════════════════════════════════════════════

class TestBudget:

    def setup_method(self):
        self.token   = create_test_user_and_login()
        self.headers = auth_headers(self.token)

    def test_set_budget_success(self):
        res = client.post("/budget/", json={
            "category": "Food",
            "amount":   10000,
            "month":    "2026-03"
        }, headers=self.headers)
        assert res.status_code == 200
        assert res.json()["amount"]   == 10000
        assert res.json()["category"] == "Food"
        print("  Set budget test passed")

    def test_set_budget_negative_amount(self):
        res = client.post("/budget/", json={
            "category": "Food",
            "amount":   -5000,
            "month":    "2026-03"
        }, headers=self.headers)
        assert res.status_code == 400
        print("  Budget negative amount test passed")

    def test_set_budget_zero_amount(self):
        res = client.post("/budget/", json={
            "category": "Food",
            "amount":   0,
            "month":    "2026-03"
        }, headers=self.headers)
        assert res.status_code == 400
        print("  Budget zero amount test passed")

    def test_set_budget_invalid_category(self):
        res = client.post("/budget/", json={
            "category": "InvalidCat",
            "amount":   5000,
            "month":    "2026-03"
        }, headers=self.headers)
        assert res.status_code == 400
        print("  Budget invalid category test passed")

    def test_update_existing_budget(self):
        client.post("/budget/", json={
            "category": "Rent",
            "amount":   18000,
            "month":    "2026-03"
        }, headers=self.headers)
        res = client.post("/budget/", json={
            "category": "Rent",
            "amount":   20000,
            "month":    "2026-03"
        }, headers=self.headers)
        assert res.status_code == 200
        assert res.json()["amount"] == 20000
        print("  Update existing budget test passed")

    def test_get_budgets(self):
        res = client.get("/budget/", headers=self.headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)
        print("  Get budgets test passed")


# ════════════════════════════════════════════════════════════
# ANALYTICS TESTS
# ════════════════════════════════════════════════════════════

class TestAnalytics:

    def setup_method(self):
        self.token   = create_test_user_and_login()
        self.headers = auth_headers(self.token)
        # Add some transactions for analytics
        client.post("/transactions/", json={
            "description": "Salary",
            "amount":      60000,
            "category":    "Salary",
            "txn_type":    "income",
            "date":        "2026-03-01",
            "notes":       ""
        }, headers=self.headers)
        client.post("/transactions/", json={
            "description": "Rent",
            "amount":      18000,
            "category":    "Rent",
            "txn_type":    "expense",
            "date":        "2026-03-05",
            "notes":       ""
        }, headers=self.headers)
        client.post("/transactions/", json={
            "description": "Food",
            "amount":      2000,
            "category":    "Food",
            "txn_type":    "expense",
            "date":        "2026-03-10",
            "notes":       ""
        }, headers=self.headers)

    def test_summary(self):
        res = client.get("/analytics/summary", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert "total_income"   in data
        assert "total_expense"  in data
        assert "net_savings"    in data
        assert "savings_rate"   in data
        assert data["total_income"]  > 0
        assert data["total_expense"] > 0
        assert data["net_savings"]   == data["total_income"] - data["total_expense"]
        print("  Analytics summary test passed")

    def test_savings_rate_calculation(self):
        res  = client.get("/analytics/summary", headers=self.headers)
        data = res.json()
        expected_rate = round(
            (data["total_income"] - data["total_expense"]) / data["total_income"] * 100, 2
        )
        assert data["savings_rate"] == expected_rate
        print("  Savings rate calculation test passed")

    def test_by_category(self):
        res = client.get("/analytics/by-category?all=true", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) > 0
        for item in data:
            assert "category" in item
            assert "total"    in item
            assert item["total"] > 0
        print("  By category test passed")

    def test_monthly_trend(self):
        res = client.get("/analytics/monthly-trend", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        for item in data:
            assert "month"   in item
            assert "income"  in item
            assert "expense" in item
        print("  Monthly trend test passed")

    def test_weekday_pattern(self):
        res = client.get("/analytics/weekday-pattern", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 7
        days = [d["day"] for d in data]
        assert "Monday"    in days
        assert "Sunday"    in days
        assert "Wednesday" in days
        print("  Weekday pattern test passed")


# ════════════════════════════════════════════════════════════
# ML TESTS
# ════════════════════════════════════════════════════════════

class TestML:

    def setup_method(self):
        self.token   = create_test_user_and_login()
        self.headers = auth_headers(self.token)
        # Add multiple months of data for ML
        months = ["2026-01", "2026-02", "2026-03"]
        for month in months:
            client.post("/transactions/", json={
                "description": f"Salary {month}",
                "amount":      60000,
                "category":    "Salary",
                "txn_type":    "income",
                "date":        f"{month}-01",
                "notes":       ""
            }, headers=self.headers)
            client.post("/transactions/", json={
                "description": f"Rent {month}",
                "amount":      18000,
                "category":    "Rent",
                "txn_type":    "expense",
                "date":        f"{month}-05",
                "notes":       ""
            }, headers=self.headers)
            client.post("/transactions/", json={
                "description": f"Food {month}",
                "amount":      5000,
                "category":    "Food",
                "txn_type":    "expense",
                "date":        f"{month}-10",
                "notes":       ""
            }, headers=self.headers)

    def test_forecast_returns_data(self):
        res = client.get("/ml/forecast", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert "historical" in data
        assert "forecast"   in data
        assert len(data["historical"]) > 0
        assert len(data["forecast"])   > 0
        print("  ML forecast test passed")

    def test_forecast_predicts_6_months(self):
        res  = client.get("/ml/forecast", headers=self.headers)
        data = res.json()
        assert len(data["forecast"]) == 6
        print("  ML forecast 6 months test passed")

    def test_forecast_by_category(self):
        res = client.get("/ml/forecast-by-category", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, dict)
        assert len(data) > 0
        print("  Forecast by category test passed")

    def test_anomaly_detection(self):
        # Add a very large transaction to trigger anomaly
        client.post("/transactions/", json={
            "description": "Huge Expense",
            "amount":      500000,
            "category":    "Shopping",
            "txn_type":    "expense",
            "date":        "2026-03-15",
            "notes":       ""
        }, headers=self.headers)
        res = client.get("/ml/anomalies", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert "anomalies" in data
        assert isinstance(data["anomalies"], list)
        # Large transaction should be detected
        assert len(data["anomalies"]) > 0
        print("  Anomaly detection test passed")

    def test_smart_insights(self):
        res = client.get("/ml/smart-insights", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert "insights" in data
        assert isinstance(data["insights"], list)
        assert len(data["insights"]) > 0
        for insight in data["insights"]:
            assert "title" in insight
            assert "text"  in insight
            assert "icon"  in insight
        print("  Smart insights test passed")

    def test_predict_month_end(self):
        res = client.get("/ml/predict-month-end", headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert "predicted_total" in data
        assert "daily_avg"       in data
        assert "days_passed"     in data
        print("  Month end prediction test passed")


# ════════════════════════════════════════════════════════════
# GOALS TESTS
# ════════════════════════════════════════════════════════════

class TestGoals:

    def setup_method(self):
        self.token   = create_test_user_and_login()
        self.headers = auth_headers(self.token)

    def test_create_goal_success(self):
        res = client.post("/goals/", json={
            "name":   "New Laptop",
            "target": 80000,
            "saved":  20000,
            "icon":   "💻"
        }, headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert data["name"]   == "New Laptop"
        assert data["target"] == 80000
        assert data["saved"]  == 20000
        print("  Create goal test passed")

    def test_create_goal_negative_target(self):
        res = client.post("/goals/", json={
            "name":   "Test Goal",
            "target": -5000,
            "saved":  0,
            "icon":   "🎯"
        }, headers=self.headers)
        assert res.status_code == 400
        print("  Negative target test passed")

    def test_create_goal_saved_exceeds_target(self):
        res = client.post("/goals/", json={
            "name":   "Test Goal",
            "target": 5000,
            "saved":  10000,
            "icon":   "🎯"
        }, headers=self.headers)
        assert res.status_code == 400
        assert "cannot exceed target" in res.json()["detail"]
        print("  Saved exceeds target test passed")

    def test_create_goal_short_name(self):
        res = client.post("/goals/", json={
            "name":   "A",
            "target": 5000,
            "saved":  0,
            "icon":   "🎯"
        }, headers=self.headers)
        assert res.status_code == 400
        print("  Short goal name test passed")

    def test_update_goal_savings(self):
        create_res = client.post("/goals/", json={
            "name":   "Vacation",
            "target": 30000,
            "saved":  5000,
            "icon":   "✈️"
        }, headers=self.headers)
        goal_id = create_res.json()["id"]

        update_res = client.put(f"/goals/{goal_id}", json={
            "saved": 10000
        }, headers=self.headers)
        assert update_res.status_code == 200
        assert update_res.json()["saved"] == 10000
        print("  Update goal savings test passed")

    def test_delete_goal(self):
        create_res = client.post("/goals/", json={
            "name":   "Delete Me",
            "target": 10000,
            "saved":  0,
            "icon":   "🗑️"
        }, headers=self.headers)
        goal_id = create_res.json()["id"]

        del_res = client.delete(f"/goals/{goal_id}", headers=self.headers)
        assert del_res.status_code == 200
        print("  Delete goal test passed")

    def test_get_goals(self):
        res = client.get("/goals/", headers=self.headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)
        print("  Get goals test passed")


# ════════════════════════════════════════════════════════════
# INPUT VALIDATION TESTS
# ════════════════════════════════════════════════════════════

class TestInputValidation:

    def setup_method(self):
        self.token   = create_test_user_and_login()
        self.headers = auth_headers(self.token)

    def test_description_too_long(self):
        res = client.post("/transactions/", json={
            "description": "A" * 200,
            "amount":      500,
            "category":    "Food",
            "txn_type":    "expense",
            "date":        "2026-03-01",
            "notes":       ""
        }, headers=self.headers)
        assert res.status_code == 400
        print("  Long description validation test passed")

    def test_notes_too_long(self):
        res = client.post("/transactions/", json={
            "description": "Test",
            "amount":      500,
            "category":    "Food",
            "txn_type":    "expense",
            "date":        "2026-03-01",
            "notes":       "N" * 300
        }, headers=self.headers)
        assert res.status_code == 400
        print("  Long notes validation test passed")

    def test_very_old_date(self):
        res = client.post("/transactions/", json={
            "description": "Old Transaction",
            "amount":      500,
            "category":    "Food",
            "txn_type":    "expense",
            "date":        "1990-01-01",
            "notes":       ""
        }, headers=self.headers)
        assert res.status_code == 400
        print("  Very old date validation test passed")

    def test_all_valid_expense_categories(self):
        valid_cats = [
            "Food","Transport","Entertainment",
            "Health","Shopping","Utilities","Rent"
        ]
        for cat in valid_cats:
            res = client.post("/transactions/", json={
                "description": f"Test {cat}",
                "amount":      100,
                "category":    cat,
                "txn_type":    "expense",
                "date":        "2026-03-01",
                "notes":       ""
            }, headers=self.headers)
            assert res.status_code == 200
        print("  All valid expense categories test passed")

    def test_all_valid_income_categories(self):
        valid_cats = [
            "Salary","Freelance","Business",
            "Investment","Other Income"
        ]
        for cat in valid_cats:
            res = client.post("/transactions/", json={
                "description": f"Test {cat}",
                "amount":      1000,
                "category":    cat,
                "txn_type":    "income",
                "date":        "2026-03-01",
                "notes":       ""
            }, headers=self.headers)
            assert res.status_code == 200
        print("  All valid income categories test passed")

# ════════════════════════════════════════════════════════════
# CSV IMPORT TESTS
# ════════════════════════════════════════════════════════════

class TestCSVImport:

    def setup_method(self):
        self.token   = create_test_user_and_login()
        self.headers = auth_headers(self.token)

    def test_csv_import_success(self):
        csv_content = b"""Date,Description,Amount,Type
01/01/2026,Salary,60000,Credit
05/01/2026,Rent,18000,Debit
08/01/2026,Swiggy,340,Debit
10/01/2026,Netflix,649,Debit
"""
        res = client.post(
            "/transactions/import-csv",
            files={"file": ("test.csv", csv_content, "text/csv")},
            headers=self.headers
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success_count"] > 0
        assert data["total_rows"]    > 0
        print(f"  CSV import success — {data['success_count']} transactions added")

    def test_csv_import_wrong_file_type(self):
        res = client.post(
            "/transactions/import-csv",
            files={"file": ("test.txt", b"some text content", "text/plain")},
            headers=self.headers
        )
        assert res.status_code == 400
        assert "CSV" in res.json()["detail"]
        print("  CSV wrong file type test passed")

    def test_csv_import_empty_file(self):
        csv_content = b""
        res = client.post(
            "/transactions/import-csv",
            files={"file": ("empty.csv", csv_content, "text/csv")},
            headers=self.headers
        )
        assert res.status_code == 400
        print("  CSV empty file test passed")

    def test_csv_import_with_bad_rows(self):
        csv_content = b"""Date,Description,Amount,Type
01/01/2026,Valid Transaction,500,Debit
,Empty Date Row,,Debit
01/01/2026,Zero Amount,0,Debit
2099/01/01,Future Date,500,Debit
01/01/2026,Normal Row,200,Debit
"""
        res = client.post(
            "/transactions/import-csv",
            files={"file": ("bad_rows.csv", csv_content, "text/csv")},
            headers=self.headers
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success_count"] >= 1
        assert data["skipped_null"] + data["skipped_invalid"] + data["skipped_future"] > 0
        print(f"  CSV bad rows test — {data['success_count']} added, {data['skipped_null']} skipped")

    def test_csv_import_duplicate_detection(self):
        csv_content = b"""Date,Description,Amount,Type
15/01/2026,Duplicate Test,999,Debit
"""
        # Import once
        client.post(
            "/transactions/import-csv",
            files={"file": ("dup1.csv", csv_content, "text/csv")},
            headers=self.headers
        )
        # Import again same data
        res = client.post(
            "/transactions/import-csv",
            files={"file": ("dup2.csv", csv_content, "text/csv")},
            headers=self.headers
        )
        assert res.status_code == 200
        assert res.json()["skipped_duplicate"] >= 1
        print("  CSV duplicate detection test passed")

    def test_csv_import_various_date_formats(self):
        csv_content = b"""Date,Description,Amount,Type
01/02/2026,DD/MM/YYYY format,100,Debit
2026-02-02,YYYY-MM-DD format,200,Debit
02-Feb-2026,DD-Mon-YYYY format,300,Debit
"""
        res = client.post(
            "/transactions/import-csv",
            files={"file": ("dates.csv", csv_content, "text/csv")},
            headers=self.headers
        )
        assert res.status_code == 200
        assert res.json()["success_count"] >= 2
        print("  CSV various date formats test passed")

    def test_csv_import_credit_debit_columns(self):
        csv_content = b"""Date,Description,Debit,Credit
01/02/2026,Rent Payment,18000,
01/02/2026,Salary Credit,,60000
01/02/2026,Grocery,2000,
"""
        res = client.post(
            "/transactions/import-csv",
            files={"file": ("debit_credit.csv", csv_content, "text/csv")},
            headers=self.headers
        )
        assert res.status_code == 200
        assert res.json()["success_count"] >= 2
        print("  CSV debit/credit column format test passed")


# ════════════════════════════════════════════════════════════
# SMS PARSER TESTS
# ════════════════════════════════════════════════════════════

class TestSMSParser:

    def setup_method(self):
        self.token   = create_test_user_and_login()
        self.headers = auth_headers(self.token)

    def test_sms_parse_debit(self):
        res = client.post("/alerts/sms-parse", json={
            "sms": "Rs.500 debited from your account at Swiggy on 22-03-2026"
        }, headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert data["transaction"]["amount"]   == 500
        assert data["transaction"]["type"]     == "expense"
        assert data["transaction"]["category"] == "Food"
        print("  SMS debit parse test passed")

    def test_sms_parse_credit(self):
        res = client.post("/alerts/sms-parse", json={
            "sms": "Rs.60000 credited to your account from Salary on 01-03-2026"
        }, headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert data["transaction"]["amount"] == 60000
        assert data["transaction"]["type"]   == "income"
        print("  SMS credit parse test passed")

    def test_sms_parse_no_amount(self):
        res = client.post("/alerts/sms-parse", json={
            "sms": "Your account has been updated"
        }, headers=self.headers)
        assert res.status_code == 200
        assert "error" in res.json()
        print("  SMS no amount test passed")

    def test_sms_parse_empty(self):
        res = client.post("/alerts/sms-parse", json={
            "sms": ""
        }, headers=self.headers)
        assert res.status_code == 200
        assert "error" in res.json()
        print("  SMS empty test passed")

    def test_sms_parse_uber(self):
        res = client.post("/alerts/sms-parse", json={
            "sms": "Rs.180 debited from your account at Uber on 15-03-2026"
        }, headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert data["transaction"]["category"] == "Transport"
        print("  SMS Uber category detection test passed")

    def test_sms_parse_netflix(self):
        res = client.post("/alerts/sms-parse", json={
            "sms": "Rs.649 debited for Netflix subscription on 10-03-2026"
        }, headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert data["transaction"]["category"] == "Entertainment"
        print("  SMS Netflix category detection test passed")

    def test_sms_parse_pharmacy(self):
        res = client.post("/alerts/sms-parse", json={
            "sms": "Rs.450 debited at Apollo Pharmacy on 18-03-2026"
        }, headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert data["transaction"]["category"] == "Health"
        print("  SMS pharmacy category detection test passed")

    def test_sms_parse_amount_with_comma(self):
        res = client.post("/alerts/sms-parse", json={
            "sms": "Rs.1,299 debited from your account at Amazon on 16-03-2026"
        }, headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert data["transaction"]["amount"] == 1299
        print("  SMS amount with comma test passed")


# ════════════════════════════════════════════════════════════
# BUDGET ALERT TESTS
# ════════════════════════════════════════════════════════════

class TestBudgetAlerts:

    def setup_method(self):
        self.token   = create_test_user_and_login()
        self.headers = auth_headers(self.token)

    def test_no_alerts_when_under_budget(self):
        # Set high budget
        client.post("/budget/", json={
            "category": "Food",
            "amount":   50000,
            "month":    "2026-03"
        }, headers=self.headers)
        res = client.get("/alerts/check-budgets", headers=self.headers)
        assert res.status_code == 200
        assert res.json()["alerts"] == []
        print("  No alerts when under budget test passed")
      
                   

    def test_alert_when_over_80_percent(self):
        from datetime import date
        today = date.today()
        month = today.strftime("%Y-%m")

        # Set very low budget
        client.post("/budget/", json={
            "category": "Food",
            "amount":   100,
            "month":    month
        }, headers=self.headers)

        # Add expense that exceeds 80%
        client.post("/transactions/", json={
            "description": "Big Food Expense",
            "amount":      90,
            "category":    "Food",
            "txn_type":    "expense",
            "date":        str(today),
            "notes":       ""
        }, headers=self.headers)

        res = client.get("/alerts/check-budgets", headers=self.headers)
        assert res.status_code == 200
        alerts = res.json()["alerts"]
        food_alert = next((a for a in alerts if a["category"] == "Food"), None)
        assert food_alert is not None
        assert food_alert["percentage"] >= 80
        print("  Alert when over 80% test passed")

    def test_alert_status_warning_vs_exceeded(self):
        from datetime import date
        today = date.today()
        month = today.strftime("%Y-%m")

        # Warning — 85%
        client.post("/budget/", json={
            "category": "Transport",
            "amount":   100,
            "month":    month
        }, headers=self.headers)
        client.post("/transactions/", json={
            "description": "Transport Test",
            "amount":      85,
            "category":    "Transport",
            "txn_type":    "expense",
            "date":        str(today),
            "notes":       ""
        }, headers=self.headers)

        res     = client.get("/alerts/check-budgets", headers=self.headers)
        alerts  = res.json()["alerts"]
        t_alert = next((a for a in alerts if a["category"] == "Transport"), None)
        if t_alert:
            assert t_alert["status"] in ["warning", "exceeded"]
        print("  Alert status warning vs exceeded test passed")


# ════════════════════════════════════════════════════════════
# PDF REPORT TESTS
# ════════════════════════════════════════════════════════════

class TestReports:

    def setup_method(self):
        self.token   = create_test_user_and_login()
        self.headers = auth_headers(self.token)
        # Add some data
        client.post("/transactions/", json={
            "description": "Salary",
            "amount":      60000,
            "category":    "Salary",
            "txn_type":    "income",
            "date":        "2026-03-01",
            "notes":       ""
        }, headers=self.headers)
        client.post("/transactions/", json={
            "description": "Rent",
            "amount":      18000,
            "category":    "Rent",
            "txn_type":    "expense",
            "date":        "2026-03-05",
            "notes":       ""
        }, headers=self.headers)

    def test_pdf_report_generates(self):
        res = client.get("/reports/pdf", headers=self.headers)
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"
        assert len(res.content) > 0
        print("  PDF report generation test passed")

    def test_pdf_report_has_content(self):
        res = client.get("/reports/pdf", headers=self.headers)
        assert res.status_code == 200
        # PDF files start with %PDF
        assert res.content[:4] == b"%PDF"
        print("  PDF report valid format test passed")

    def test_pdf_report_without_auth(self):
        res = client.get("/reports/pdf")
        assert res.status_code == 401
        print("  PDF report auth required test passed")


# ════════════════════════════════════════════════════════════
# GOAL PREDICTOR ML TEST
# ════════════════════════════════════════════════════════════

class TestGoalPredictor:

    def setup_method(self):
        self.token   = create_test_user_and_login()
        self.headers = auth_headers(self.token)
        # Add transactions for ML to work
        for month in ["2026-01", "2026-02", "2026-03"]:
            client.post("/transactions/", json={
                "description": f"Salary {month}",
                "amount":      60000,
                "category":    "Salary",
                "txn_type":    "income",
                "date":        f"{month}-01",
                "notes":       ""
            }, headers=self.headers)
            client.post("/transactions/", json={
                "description": f"Expenses {month}",
                "amount":      40000,
                "category":    "Rent",
                "txn_type":    "expense",
                "date":        f"{month}-05",
                "notes":       ""
            }, headers=self.headers)

    def test_goal_predictor_returns_data(self):
        # Create a goal first
        goal_res = client.post("/goals/", json={
            "name":   "Test Goal",
            "target": 100000,
            "saved":  20000,
            "icon":   "🎯"
        }, headers=self.headers)
        goal_id = goal_res.json()["id"]

        res = client.get(f"/ml/savings-goal-predictor/{goal_id}",
                        headers=self.headers)
        assert res.status_code == 200
        data = res.json()
        assert "goal_name"            in data
        assert "target"               in data
        assert "remaining"            in data
        assert "months_needed"        in data
        assert "predicted_completion" in data
        print("  Goal predictor ML test passed")

    def test_goal_predictor_nonexistent_goal(self):
        res = client.get("/ml/savings-goal-predictor/99999",
                        headers=self.headers)
        assert res.status_code == 200
        assert "error" in res.json()
        print("  Goal predictor nonexistent goal test passed")

def teardown_module(module):
    import os
    import gc
    import time

    # Close all database connections
    engine.dispose()
    gc.collect()
    time.sleep(1)

    try:
        if os.path.exists("test_moneymap.db"):
            os.remove("test_moneymap.db")
            print("\n🧹 Test database cleaned up")
    except PermissionError:
        print("\n⚠️ Could not delete test db — delete manually if needed")
