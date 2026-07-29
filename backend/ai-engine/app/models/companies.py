from sqlalchemy import Column, Integer, String, DateTime, BigInteger
from sqlalchemy.sql import func
from app.core.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column("symbol", String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    sector = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    business_type = Column(String, nullable=True)
    description = Column(String, nullable=True)
    email = Column(String, nullable=True)
    website = Column(String, nullable=True)
    date_listed = Column(DateTime(timezone=False), nullable=True)
    date_of_incorporation = Column(DateTime(timezone=False), nullable=True)
    shares_outstanding = Column(BigInteger, nullable=True)
    current_status = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
