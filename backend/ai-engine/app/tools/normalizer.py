from typing import Dict, Any

class Normalizer:
    # A mapping of common financial terms to our standardized keys
    FIELD_MAPPINGS = {
        "interest_expense": [
            "finance cost", "interest expense", "borrowing cost", 
            "interest on loans", "cost of funds"
        ],
        "interest_income": [
            "finance income", "interest income", "investment income", 
            "income from deposits"
        ],
        "total_debt": [
            "interest bearing debt", "total borrowings", "short-term and long-term borrowings", 
            "loans and borrowings", "bank loans", "debt"
        ],
        "cash_and_equivalents": [
            "cash and cash equivalents", "cash & bank balances", "cash", 
            "cash and bank balances"
        ],
        "total_assets": [
            "total assets", "assets"
        ],
        "total_revenue": [
            "revenue", "turnover", "gross earnings", "total income", "sales"
        ],
        "accounts_receivable": [
            "trade and other receivables", "trade receivables", "accounts receivable", 
            "receivables"
        ]
    }

    @classmethod
    def normalize(cls, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Takes a dictionary of raw extracted financial fields and maps them to standardized keys.
        """
        normalized = {}
        
        # Invert the mapping for quick lookup: { "finance cost": "interest_expense" }
        lookup = {}
        for std_key, variations in cls.FIELD_MAPPINGS.items():
            for variation in variations:
                lookup[variation.lower()] = std_key
                
        for raw_key, value in raw_data.items():
            clean_key = str(raw_key).lower().strip()
            
            # If the raw key exactly matches one of our variations
            if clean_key in lookup:
                normalized_key = lookup[clean_key]
                normalized[normalized_key] = value
                continue
                
            # Fuzzy match / substring match fallback
            matched = False
            for variation, std_key in lookup.items():
                if variation in clean_key or clean_key in variation:
                    normalized[std_key] = value
                    matched = True
                    break
            
            if not matched:
                # Keep unmapped fields as-is, just snake_cased
                fallback_key = clean_key.replace(" ", "_").replace("-", "_")
                normalized[fallback_key] = value
                
        return normalized
