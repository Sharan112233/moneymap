from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import database, models
from routes.transactions import router as transactions_router
from routes.budget       import router as budget_router
from routes.analytics    import router as analytics_router
from routes.ml           import router as ml_router
from routes.goals        import router as goals_router
from routes.reports      import router as reports_router
from routes.alerts       import router as alerts_router
from routes.auth_routes  import router as auth_router
from forgot_password_endpoints import router as forgot_router
import re
from fastapi.middleware.cors import CORSMiddleware
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="MoneyMap API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:5173",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(forgot_router)
app.include_router(transactions_router)
app.include_router(budget_router)
app.include_router(analytics_router)
app.include_router(ml_router)
app.include_router(goals_router)
app.include_router(reports_router)
app.include_router(alerts_router)


@app.get("/")
def root():
    return {"message": "MoneyMap API running"}