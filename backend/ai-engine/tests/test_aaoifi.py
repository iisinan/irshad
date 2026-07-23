import pytest
from app.tools.aaoifi_calculator import AAOIFICalculator
from app.tools.normalizer import Normalizer

def test_normalization():
    raw_data = {
        "Finance Cost": 500,
        "Cash and Bank Balances": 1500,
        "Turnover": 10000,
        "Short-term and Long-term Borrowings": 2000,
        "Assets": 50000
    }
    
    normalized = Normalizer.normalize(raw_data)
    
    assert normalized.get("interest_expense") == 500
    assert normalized.get("cash_and_equivalents") == 1500
    assert normalized.get("total_revenue") == 10000
    assert normalized.get("total_debt") == 2000
    assert normalized.get("total_assets") == 50000

def test_aaoifi_calculation_pass():
    data = {
        "total_assets": 100000,
        "total_debt": 20000,         # 20% (<30%)
        "cash_and_equivalents": 25000, # 25% (<30%)
        "total_revenue": 50000,
        "interest_income": 1000      # 2% (<5%)
    }
    
    result = AAOIFICalculator.calculate(data, market_cap=0.0) # Fallback to total assets
    
    assert result["status"]["debt_pass"] is True
    assert result["status"]["cash_pass"] is True
    assert result["status"]["income_pass"] is True
    assert result["overall_financial_pass"] is True

def test_aaoifi_calculation_fail_debt():
    data = {
        "total_assets": 100000,
        "total_debt": 35000,         # 35% (>30%) - FAIL
        "cash_and_equivalents": 25000,
        "total_revenue": 50000,
        "interest_income": 1000
    }
    
    result = AAOIFICalculator.calculate(data, market_cap=0.0)
    
    assert result["status"]["debt_pass"] is False
    assert result["overall_financial_pass"] is False
