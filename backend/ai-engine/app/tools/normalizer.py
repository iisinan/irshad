from typing import Dict, Any

# NGN conversion rates for foreign-currency reports
CURRENCY_TO_NGN = {
    "NGN": 1,
    "USD": 1550,
    "GBP": 1970,
}

# Monetary fields that need unit scaling
MONETARY_FIELDS = {
    "total_revenue", "total_debt", "cash_and_equivalents",
    "interest_income", "total_assets", "net_income",
    "interest_expense", "accounts_receivable", "illiquid_assets",
    "interest_bearing_securities",
}

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
        Takes a dictionary of raw extracted financial fields and:
        1. Maps them to standardized keys
        2. Applies unit_multiplier (e.g. ×1000 for NGN'000 reports)
        3. Converts foreign currencies to NGN
        """
        # Extract meta fields before normalizing
        unit_multiplier = float(raw_data.get("unit_multiplier", 1) or 1)
        reporting_currency = str(raw_data.get("reporting_currency", "NGN") or "NGN").upper().strip()
        currency_rate = CURRENCY_TO_NGN.get(reporting_currency, 1)

        # Combined scale factor: unit × currency
        scale = unit_multiplier * currency_rate

        if scale != 1:
            print(f"[Normalizer] Applying scale factor: {scale} "
                  f"(unit_multiplier={unit_multiplier}, currency={reporting_currency}@{currency_rate})")

        # Invert the mapping for quick lookup
        lookup = {}
        for std_key, variations in cls.FIELD_MAPPINGS.items():
            for variation in variations:
                lookup[variation.lower()] = std_key

        normalized = {}
        for raw_key, value in raw_data.items():
            # Skip meta fields
            if raw_key in ("unit_multiplier", "reporting_currency", "financial_year_end_date",
                           "is_bank_or_financial", "published_date"):
                normalized[raw_key] = value
                continue

            clean_key = str(raw_key).lower().strip()

            # Map to standard key
            if clean_key in lookup:
                std_key = lookup[clean_key]
            else:
                # Fuzzy substring match
                std_key = None
                for variation, mapped in lookup.items():
                    if variation in clean_key or clean_key in variation:
                        std_key = mapped
                        break
                if not std_key:
                    std_key = clean_key.replace(" ", "_").replace("-", "_")

            # Apply scale to monetary fields
            if std_key in MONETARY_FIELDS and value is not None:
                # If Gemini returned our new structured evidence object {value, page, quote, confidence}
                if isinstance(value, dict) and "value" in value:
                    raw_val = value.get("value")
                    if isinstance(raw_val, (int, float)):
                        value["value"] = raw_val * scale
                    normalized[std_key] = value
                # Fallback for old flat number format
                elif isinstance(value, (int, float)):
                    normalized[std_key] = value * scale
                else:
                    normalized[std_key] = value
            else:
                normalized[std_key] = value

        return normalized
