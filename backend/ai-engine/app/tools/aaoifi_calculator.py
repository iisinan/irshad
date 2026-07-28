from typing import Dict, Any, Tuple

class AAOIFICalculator:
    # AAOIFI Standard No. 21 Thresholds
    DEBT_THRESHOLD             = 0.30   # < 30% of Market Cap (or Total Assets)
    CASH_THRESHOLD             = 0.33   # < 33% of Market Cap (or Total Assets)
    NON_PERMISSIBLE_INCOME     = 0.05   # < 5%  of Total Revenue

    @classmethod
    def calculate(
        cls,
        normalized_data: Dict[str, float],
        market_cap: float,
        company_type: str = "standard"   # "standard" | "bank"
    ) -> Dict[str, Any]:
        """
        Deterministically calculates AAOIFI Standard No. 21 ratios.

        company_type:
          "standard" - normal company: debt = total borrowings, income = interest income / revenue
          "bank"     - financial institution: use interest_bearing_borrowings for debt ratio;
                       income screen always fails (core business is interest-based)
        """
        def get_val(key):
            val = normalized_data.get(key, 0.0)
            if isinstance(val, dict) and "value" in val:
                return float(val.get("value", 0.0) or 0.0)
            return float(val or 0.0)

        total_assets   = get_val("total_assets")
        total_debt     = get_val("total_debt")
        cash           = get_val("cash_and_equivalents")
        total_revenue  = get_val("total_revenue")
        interest_income = get_val("interest_income")

        # Determine denominator: prefer market cap, fall back to total assets
        denominator      = market_cap if market_cap > 0 else total_assets
        denominator_type = "Market Capitalization" if market_cap > 0 else "Total Assets"

        # ── Debt Ratio ──────────────────────────────────────────────────────────
        # For banks: customer deposits are NOT debt under AAOIFI screening.
        # total_debt should already be borrowings-only (enforced in pdf_extractor).
        debt_ratio = (total_debt / denominator) if denominator > 0 else float('inf')

        # ── Cash & Liquid Assets Ratio ──────────────────────────────────────────
        cash_ratio = (cash / denominator) if denominator > 0 else float('inf')

        # ── Impermissible Income Ratio ──────────────────────────────────────────
        if company_type == "bank":
            # Banks' entire revenue is interest-based → always fails business screen,
            # but the INCOME ratio here would be 100%. We record it accurately.
            income_ratio = 1.0  # 100% — used for transparency in the record
            income_override = True
        else:
            income_ratio = (interest_income / total_revenue) if total_revenue > 0 else float('inf')
            income_override = False

        # ── Pass / Fail ─────────────────────────────────────────────────────────
        debt_pass   = debt_ratio  < cls.DEBT_THRESHOLD
        cash_pass   = cash_ratio  < cls.CASH_THRESHOLD
        income_pass = income_ratio < cls.NON_PERMISSIBLE_INCOME

        results = {
            "company_type":       company_type,
            "denominator_used":   denominator_type,
            "denominator_value":  denominator,
            "ratios": {
                "interest_bearing_debt_ratio":    round(debt_ratio, 6),
                "cash_and_equivalents_ratio":     round(cash_ratio, 6),
                "non_permissible_income_ratio":   round(income_ratio, 6),
            },
            "status": {
                "debt_pass":    debt_pass,
                "cash_pass":    cash_pass,
                "income_pass":  income_pass,
                "income_override_bank": income_override,
            },
        }

        results["overall_financial_pass"] = all([
            results["status"]["debt_pass"],
            results["status"]["cash_pass"],
            results["status"]["income_pass"],
        ])

        return results

    @classmethod
    def verify_business_activities(cls, activities: list) -> Dict[str, Any]:
        """
        Deterministically evaluates extracted business activities against AAOIFI prohibited sectors.
        Returns the compliance status and the matched haram keywords if any.
        """
        prohibited_keywords = [
            "interest", "bank", "banking", "riba", "insurance", "assurance", "lending", 
            "microfinance", "credit", "mortgage", "alcohol", "brew", "brewery", "liquor", 
            "spirits", "wine", "distilling", "pork", "swine", "porcine", "gambling", 
            "casino", "betting", "lottery", "pornography", "escort", "weapons", "arms", 
            "munitions", "tobacco", "cigarette", "vaping"
        ]

        matched_keywords = set()
        
        for activity in activities:
            activity_lower = activity.lower()
            for keyword in prohibited_keywords:
                # Basic substring match. Can be enhanced with regex or NLP if needed.
                if keyword in activity_lower:
                    matched_keywords.add(keyword)
        
        status = "Halal"
        if matched_keywords:
            status = "Non-Compliant"

        return {
            "business_compliance_status": status,
            "matched_prohibited_keywords": list(matched_keywords)
        }

