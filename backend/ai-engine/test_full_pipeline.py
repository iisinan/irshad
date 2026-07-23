import asyncio
from dotenv import load_dotenv

# Load env before importing modules that depend on it
load_dotenv(dotenv_path="../backend/.env")

from app.graph.builder import build_graph
from app.graph.state import GraphState
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.companies import Company

async def setup_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        # Create a test company if it doesn't exist
        from sqlalchemy.future import select
        result = await session.execute(select(Company).where(Company.ticker == "ARADEL"))
        company = result.scalars().first()
        if not company:
            print("Creating test company: ARADEL...")
            session.add(Company(ticker="ARADEL", name="Aradel Holdings", sector="Energy", industry="Oil & Gas"))
            await session.commit()

async def main():
    print("Setting up DB...")
    await setup_test_db()
    
    print("\nStarting Phase 1 Test (Apify Search -> Download -> R2 Upload)...")
    app = build_graph()
    
    initial_state = GraphState(
        ticker="ARADEL",
        financial_year=2024,
        annual_report_url="local_file",
        pdf_path="../backend/storage/app/Aradel-2025-Annual-Report.pdf"
    )
    
    final_state = await app.ainvoke(initial_state)
    
    print("\n=== FINAL STATE ===")
    print(f"Company: {final_state.get('company_name')}")
    print(f"Apify Found URL: {final_state.get('annual_report_url')}")
    print(f"Downloaded Local Path: {final_state.get('pdf_path')}")
    print(f"AI Explanation:\n{final_state.get('ai_explanation')}")
    
    # Check DB for the uploaded document
    async with AsyncSessionLocal() as session:
        from sqlalchemy.future import select
        from app.models.financial_documents import FinancialDocument
        result = await session.execute(select(FinancialDocument))
        docs = result.scalars().all()
        print(f"\nDocuments in Database ({len(docs)} found):")
        for doc in docs:
            print(f"- S3 Key: {doc.s3_key} | Checksum: {doc.checksum[:8]}...")

if __name__ == "__main__":
    asyncio.run(main())
