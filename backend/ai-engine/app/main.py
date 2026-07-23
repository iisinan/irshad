from fastapi import FastAPI
from app.api.endpoints import router
from app.core.database import engine, Base

# Import models so they are registered with Base
from app.models.financial_screening import FinancialScreening
from app.models.companies import Company
from app.models.financial_documents import FinancialDocument
from app.models.financial_statements_raw import FinancialStatementRaw
from app.models.financial_statements_normalized import FinancialStatementNormalized

app = FastAPI(
    title="Irshad AI Financial Data Collection Engine",
    description="Deterministic Financial Extraction & AAOIFI Screening API",
    version="1.0.0"
)

app.include_router(router)

@app.on_event("startup")
async def startup_event():
    # In a production environment, use Alembic. 
    # For MVP, we auto-create tables on startup if they don't exist.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
