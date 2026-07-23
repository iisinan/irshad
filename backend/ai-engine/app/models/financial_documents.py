from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class FinancialDocument(Base):
    __tablename__ = "financial_documents"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    
    document_type = Column(String, nullable=False) # e.g. "Annual Report", "Interim"
    financial_year = Column(Integer, nullable=False)
    reporting_period = Column(String, nullable=False, default="FY") # Q1, Q2, Q3, FY
    published_date = Column(DateTime(timezone=True), nullable=True)
    
    # Original source
    source_url = Column(String, nullable=False)
    
    # Cloudflare R2 / S3 storage
    s3_key = Column(String, unique=True, nullable=False)
    checksum = Column(String, nullable=True) # SHA256 of file
    
    downloaded_at = Column(DateTime(timezone=True), server_default=func.now())
