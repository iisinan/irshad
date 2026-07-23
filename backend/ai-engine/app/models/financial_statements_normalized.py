from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class FinancialStatementNormalized(Base):
    __tablename__ = "financial_statements_normalized"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("financial_documents.id", ondelete="CASCADE"), nullable=False)
    
    financial_year = Column(Integer, nullable=False)
    reporting_period = Column(String, nullable=False, default="FY") # Q1, Q2, Q3, FY
    published_date = Column(DateTime, nullable=True)
    
    # Core AAOIFI Fields
    total_revenue = Column(Float, nullable=True)
    total_assets = Column(Float, nullable=True)
    total_liabilities = Column(Float, nullable=True)
    total_debt = Column(Float, nullable=True)
    interest_expense = Column(Float, nullable=True)
    interest_income = Column(Float, nullable=True)
    cash_and_equivalents = Column(Float, nullable=True)
    accounts_receivable = Column(Float, nullable=True)
    investments = Column(Float, nullable=True)
    
    # Confidence Score across sources (e.g., Gemini vs Yahoo Finance)
    confidence_score = Column(Float, nullable=False, default=0.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
