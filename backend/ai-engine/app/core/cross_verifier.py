from typing import Dict, Any, Optional

class CrossVerifier:
    """
    Responsible for merging newly extracted PDF/AI data with existing verified data from the database.
    It protects existing verified >0 data, only backfills 0s, and handles discrepancies.
    """
    def __init__(self):
        pass

    def merge_financials(self, existing_data: Optional[Dict[str, Any]], new_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merges old verified data with newly extracted data.
        If existing_data has a value > 0, it is retained.
        If existing_data has a value == 0 and new_data has a value > 0, the new value is backfilled.
        If existing_data has no value, the new value is accepted.
        """
        if not existing_data:
            return new_data

        merged = {}
        # Core AAOIFI Fields
        fields = ['total_revenue', 'total_debt', 'total_assets', 'cash_and_equivalents', 'interest_income', 'market_cap']
        
        for field in fields:
            existing_field = existing_data.get(field, {})
            new_field = new_data.get(field, {})
            
            existing_val = existing_field.get('value', 0)
            new_val = new_field.get('value', 0)
            
            if existing_val > 0:
                merged[field] = existing_field # Protect verified data
            elif new_val > 0 and new_field.get('confidence', 0) >= 80:
                merged[field] = new_field # Backfill missing/zero data with high confidence new data
            else:
                merged[field] = existing_field # Keep 0
                
        # Non-numeric metadata fields (currency, multiplier, etc) are taken from the best source.
        # Prefer existing verified metadata if the numeric fields were mostly retained.
        merged['financial_year'] = existing_data.get('financial_year') or new_data.get('financial_year')
        merged['reporting_currency'] = existing_data.get('reporting_currency') or new_data.get('reporting_currency')
        merged['unit_multiplier'] = existing_data.get('unit_multiplier') or new_data.get('unit_multiplier', 1)
        merged['financial_year_end_date'] = existing_data.get('financial_year_end_date') or new_data.get('financial_year_end_date')
        merged['published_date'] = existing_data.get('published_date') or new_data.get('published_date')

        return merged

    def calculate_confidence(self, source_reliability: int, cross_agreement: int, freshness: int, ai_confidence: int) -> int:
        """
        Overall Confidence = (Source Reliability * 50%) + (Cross-Source Agreement * 25%) + 
                             (Data Freshness * 15%) + (AI Extraction Confidence * 10%)
        """
        total = (source_reliability * 0.50) + (cross_agreement * 0.25) + (freshness * 0.15) + (ai_confidence * 0.10)
        return int(total)
