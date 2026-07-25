from langgraph.graph import StateGraph, END
from app.graph.state import GraphState
from app.graph.nodes import (
    initialise_and_check_cache,
    collect_business_intelligence,
    search_financial_statements,
    download_pdf,
    store_pdf,
    extract_financial_data,
    cross_verify_data,
    collect_market_data,
    normalise_financials,
    calculate_aaoifi,
    generate_explanation,
    confidence_scoring
)

def build_graph() -> StateGraph:
    workflow = StateGraph(GraphState)
    
    # Add Nodes
    workflow.add_node("init_and_cache", initialise_and_check_cache)
    workflow.add_node("business_intel", collect_business_intelligence)
    workflow.add_node("search_financials", search_financial_statements)
    workflow.add_node("download_pdf", download_pdf)
    workflow.add_node("store_pdf", store_pdf)
    workflow.add_node("extract_financials", extract_financial_data)
    workflow.add_node("cross_verify", cross_verify_data)
    workflow.add_node("market_data", collect_market_data)
    workflow.add_node("normalise", normalise_financials)
    workflow.add_node("calculate_aaoifi", calculate_aaoifi)
    workflow.add_node("explain", generate_explanation)
    workflow.add_node("score_confidence", confidence_scoring)
    
    # Define Edges
    workflow.set_entry_point("init_and_cache")
    workflow.add_edge("init_and_cache", "business_intel")
    workflow.add_edge("business_intel", "search_financials")
    workflow.add_edge("search_financials", "download_pdf")
    workflow.add_edge("download_pdf", "store_pdf")
    workflow.add_edge("store_pdf", "extract_financials")
    workflow.add_edge("extract_financials", "cross_verify")
    workflow.add_edge("cross_verify", "market_data")
    workflow.add_edge("market_data", "normalise")
    workflow.add_edge("normalise", "calculate_aaoifi")
    workflow.add_edge("calculate_aaoifi", "explain")
    workflow.add_edge("explain", "score_confidence")
    workflow.add_edge("score_confidence", END)
    
    return workflow.compile()
