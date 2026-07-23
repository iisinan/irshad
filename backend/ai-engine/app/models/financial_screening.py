import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, func, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

VariantJSON = JSON().with_variant(JSON, "sqlite")

class FinancialScreening(Base):
    __tablename__ = "financial_screenings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    company_ticker = Column(String, index=True, nullable=False)
    financial_year = Column(Integer, nullable=False)
    
    published_date = Column(DateTime(timezone=True), nullable=True)
    report_quarter = Column(String, nullable=True)
    
    # Stores what every source reported (Array or dict of sources -> values)
    raw_source_values = Column(JSON, nullable=False, default=dict)
    
    # Normalized versions of the raw values mapping various keys to standard internal keys
    normalized_values = Column(JSON, nullable=False, default=dict)
    
    # The final, best value chosen after conflict resolution
    chosen_values = Column(JSON, nullable=False, default=dict)
    
    confidence_score = Column(Float, nullable=False, default=0.0)
    
    # E.g., {"pdf_url": "...", "ngx_url": "..."}
    source_urls = Column(JSON, nullable=False, default=dict)
    
    # Deterministic output of the AAOIFI calculation engine
    calculation_results = Column(JSON, nullable=False, default=dict)
    
    # AI generated explanation of the calculation and sources
    ai_explanation = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
