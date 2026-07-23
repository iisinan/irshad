import os
from google import genai
from typing import Dict, Any

class AIExplainer:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    def generate_explanation(self, company_name: str, calc_results: Dict[str, Any]) -> str:
        """
        Uses Gemini to generate a human-readable explanation of the AAOIFI math results.
        If no API key is provided, returns a deterministic fallback string.
        """
        is_pass = calc_results.get("overall_financial_pass", False)
        status_text = "Shariah Compliant" if is_pass else "Non-Compliant"
        
        # Prepare the facts for the prompt
        facts = f"Company: {company_name}\n"
        facts += f"Overall Status: {status_text}\n"
        
        ratios = calc_results.get("ratios", {})
        status = calc_results.get("status", {})
        
        facts += f"Debt Ratio: {ratios.get('interest_bearing_debt_ratio', 0)*100:.2f}% (Limit < 30%. Pass: {status.get('debt_pass')})\n"
        facts += f"Cash Ratio: {ratios.get('cash_and_equivalents_ratio', 0)*100:.2f}% (Limit < 30%. Pass: {status.get('cash_pass')})\n"
        facts += f"Non-Permissible Income Ratio: {ratios.get('non_permissible_income_ratio', 0)*100:.2f}% (Limit < 5%. Pass: {status.get('income_pass')})\n"
        facts += f"Denominator Used: {calc_results.get('denominator_used')}\n"

        if not self.client:
            # Fallback when mocked
            return f"Based on deterministic calculations, {company_name} is {status_text}. " \
                   f"The Debt Ratio is {ratios.get('interest_bearing_debt_ratio', 0)*100:.2f}%, " \
                   f"Cash Ratio is {ratios.get('cash_and_equivalents_ratio', 0)*100:.2f}%, and " \
                   f"Income Ratio is {ratios.get('non_permissible_income_ratio', 0)*100:.2f}%."

        prompt = f"""
        You are an expert Islamic Finance analyst. Based on the following deterministic AAOIFI math results, 
        write a short, professional 2-3 sentence explanation for a retail investor as to why this company is or isn't Shariah compliant.
        Do not do any math yourself, just explain the provided facts cleanly.
        
        FACTS:
        {facts}
        """

        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            return response.text.strip()
        except Exception as e:
            print(f"Failed to generate AI explanation: {e}")
            return "Explanation could not be generated."
