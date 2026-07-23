from typing import Dict, Any, Tuple

class AAOIFICalculator:
    # AAOIFI Thresholds
    DEBT_THRESHOLD = 0.30          # < 30% of Market Cap or Total Assets
    CASH_THRESHOLD = 0.30          # < 30% of Market Cap or Total Assets
    NON_PERMISSIBLE_INCOME = 0.05  # < 5% of Total Revenue

    @classmethod
    def calculate(cls, normalized_data: Dict[str, float], market_cap: float) -> Dict[str, Any]:
        """
        Deterministically calculates AAOIFI ratios.
        Uses Market Cap if available, otherwise falls back to Total Assets.
        """
        total_assets = normalized_data.get("total_assets", 0.0)
        total_debt = normalized_data.get("total_debt", 0.0)
        cash = normalized_data.get("cash_and_equivalents", 0.0)
        total_revenue = normalized_data.get("total_revenue", 0.0)
        interest_income = normalized_data.get("interest_income", 0.0)
        
        # Determine denominator
        denominator = market_cap if market_cap > 0 else total_assets
        denominator_type = "Market Capitalization" if market_cap > 0 else "Total Assets"

        # Safe division
        debt_ratio = (total_debt / denominator) if denominator > 0 else float('inf')
        cash_ratio = (cash / denominator) if denominator > 0 else float('inf')
        income_ratio = (interest_income / total_revenue) if total_revenue > 0 else float('inf')

        results = {
            "denominator_used": denominator_type,
            "denominator_value": denominator,
            "ratios": {
                "interest_bearing_debt_ratio": round(debt_ratio, 4),
                "cash_and_equivalents_ratio": round(cash_ratio, 4),
                "non_permissible_income_ratio": round(income_ratio, 4)
            },
            "status": {
                "debt_pass": debt_ratio < cls.DEBT_THRESHOLD,
                "cash_pass": cash_ratio < cls.CASH_THRESHOLD,
                "income_pass": income_ratio < cls.NON_PERMISSIBLE_INCOME
            }
        }
        
        # Overall status based only on financial ratios (Business activity handled separately)
        results["overall_financial_pass"] = all([
            results["status"]["debt_pass"],
            results["status"]["cash_pass"],
            results["status"]["income_pass"]
        ])
        
        return results
