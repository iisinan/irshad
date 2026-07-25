from typing import TypedDict, Optional, List, Dict, Any

class GraphState(TypedDict):
    ticker: str
    company_name: Optional[str]
    financial_year: Optional[int]
    company_id: Optional[int]
    
    # 2. Cache
    existing_financial_data: Optional[Dict[str, Any]]
    
    # 3. Collect Business Intelligence
    business_intelligence: Dict[str, Any]
    
    # 4. Search Financial Statements (Apify)
    search_results: Dict[str, Any]
    
    # 5 & 6. Verify & Download PDF
    annual_report_url: Optional[str]
    pdf_path: Optional[str]
    
    # 7. Store PDF (R2)
    r2_storage_url: Optional[str]
    sha256_hash: Optional[str]
    
    # 8. Extract Financial Data (Gemini)
    raw_pdf_extraction: Dict[str, Any]
    
    # 9. Validate Extraction (Python rules)
    is_extraction_valid: bool
    
    # 10. Cross Verify Financial Data (CrossVerifier)
    cross_verified_data: Dict[str, Any]
    
    # 11. Collect Market Data
    market_data: Dict[str, Any]
    
    # 12. Collect Business News (Perplexity)
    business_news: List[Dict[str, Any]]
    
    # 13. Normalise Financial Values (Normalizer)
    normalized_data: Dict[str, Any]
    
    # 14. Currency Conversion (Handled in Normalizer, but explicit state)
    currency_conversion_applied: bool
    
    # 15. Calculate AAOIFI Ratios (AAOIFICalculator)
    calculation_results: Dict[str, Any]
    
    # 16. Business Classification
    business_classification_results: Dict[str, Any]
    
    # 17. Generate Explanation
    ai_explanation: Optional[str]
    
    # 18. Confidence Scoring
    confidence_score: int
    confidence_breakdown: Dict[str, int]
    
    # Tracking
    source_urls: Dict[str, str]
    skip_financials: bool
    error: Optional[str]
