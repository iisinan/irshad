from typing import TypedDict, Optional, List, Dict, Any

class GraphState(TypedDict):
    ticker: str
    company_name: Optional[str]
    financial_year: Optional[int]
    
    # 1. Search & Locate
    search_results: Dict[str, Any]
    annual_report_url: Optional[str]
    
    # 2. Download & Extract
    pdf_path: Optional[str]
    raw_pdf_extraction: Dict[str, Any]
    
    # 3. Multiple Sources
    secondary_sources_data: Dict[str, Dict[str, Any]]
    
    # 4. Normalization & Validation
    normalized_data: Dict[str, Dict[str, Any]]
    final_chosen_values: Dict[str, Any]
    confidence_score: float
    source_urls: Dict[str, str]
    
    # 5. AAOIFI Engine
    calculation_results: Dict[str, Any]
    
    # 6. Output
    ai_explanation: Optional[str]
    business_screening_result: Optional[Dict[str, Any]]
    error: Optional[str]
