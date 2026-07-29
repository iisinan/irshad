import asyncio
import os
import sys
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import AsyncSessionLocal
from app.models.companies import Company
from app.tools.apify_client import FinancialScraper
from datetime import datetime

async def main():
    print("Starting Profile Data Ingestion...")
    scraper = FinancialScraper()
    
    async with AsyncSessionLocal() as db:
        if len(sys.argv) > 1:
            ticker_arg = sys.argv[1]
            result = await db.execute(select(Company).where(Company.ticker == ticker_arg))
        else:
            result = await db.execute(select(Company))
        
        # Detach them so they can be updated in new sessions
        companies = result.scalars().all()
        # Ensure we have all data loaded and disconnected from the current session
        companies_data = [{"id": c.id, "ticker": c.ticker, "name": c.name} for c in companies]
        
    print(f"Found {len(companies_data)} companies to process.")
    
    for comp_data in companies_data:
        ticker = comp_data["ticker"]
        name = comp_data["name"]
        comp_id = comp_data["id"]
        
        print(f"--- Processing {ticker} ({name}) ---")
        
        try:
            res = await scraper.search_latest_financial_report_pdfs(ticker, name, 2026)
            profile = res.get("profile", {})
            
            if profile:
                print(f"[{ticker}] Extracted profile data: {profile}")
                
                async with AsyncSessionLocal() as update_db:
                    comp_result = await update_db.execute(select(Company).where(Company.id == comp_id))
                    company = comp_result.scalars().first()
                    
                    if not company:
                        continue
                        
                    if "Email" in profile:
                        company.email = profile["Email"]
                    if "Website" in profile:
                        company.website = profile["Website"]
                        
                    if "Date Listed" in profile:
                        try:
                            dt = datetime.strptime(profile["Date Listed"], "%b-%d-%Y")
                            company.date_listed = dt.date()
                        except Exception as e:
                            print(f"[{ticker}] Could not parse date_listed '{profile['Date Listed']}': {e}")
                            
                    if "Date of Incorporation" in profile:
                        try:
                            dt = datetime.strptime(profile["Date of Incorporation"], "%b-%d-%Y")
                            company.date_of_incorporation = dt.date()
                        except Exception as e:
                            print(f"[{ticker}] Could not parse date_of_incorporation '{profile['Date of Incorporation']}': {e}")
                            
                    if "Sector" in profile:
                        company.sector = profile["Sector"]
                    if "Sub Sector" in profile:
                        company.industry = profile["Sub Sector"]
                    if "Nature of Business" in profile:
                        company.business_type = profile["Nature of Business"]
                        company.description = profile["Nature of Business"]
                        
                    if "Shares Outstanding (Mil.)" in profile:
                        try:
                            val = profile["Shares Outstanding (Mil.)"].replace(",", "")
                            shares = int(float(val))
                            company.shares_outstanding = shares
                        except Exception as e:
                            print(f"[{ticker}] Could not parse shares_outstanding: {e}")
                            
                    update_db.add(company)
                    await update_db.commit()
                    print(f"[{ticker}] Successfully updated database profile!")
            else:
                print(f"[{ticker}] No profile data extracted.")
                
        except Exception as e:
            print(f"[{ticker}] Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
