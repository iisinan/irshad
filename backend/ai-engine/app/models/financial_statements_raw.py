from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class FinancialStatementRaw(Base):
    __tablename__ = "financial_statements_raw"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("financial_documents.id", ondelete="CASCADE"), nullable=False)
    
    financial_year = Column(Integer, nullable=False)
    reporting_period = Column(String, nullable=False, default="FY") # Q1, Q2, Q3, FY
    
    # The raw extracted JSON from Gemini (before normalization)
    raw_json = Column(JSON, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
