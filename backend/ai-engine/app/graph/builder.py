from langgraph.graph import StateGraph, END
from app.graph.state import GraphState
from app.graph.nodes import (
    search_company,
    check_financial_cache,
    fetch_perplexity_data,
    collect_multiple_sources,
    normalize_data,
    validate_and_resolve,
    calculate_aaoifi,
    generate_explanation,
    store_results
)

def build_graph():
    workflow = StateGraph(GraphState)

    # Add Nodes
    workflow.add_node("search_company", search_company)
    workflow.add_node("check_financial_cache", check_financial_cache)
    workflow.add_node("fetch_perplexity_data", fetch_perplexity_data)
    workflow.add_node("collect_multiple_sources", collect_multiple_sources)
    workflow.add_node("normalize_data", normalize_data)
    workflow.add_node("validate_and_resolve", validate_and_resolve)
    workflow.add_node("calculate_aaoifi", calculate_aaoifi)
    workflow.add_node("generate_explanation", generate_explanation)
    workflow.add_node("store_results", store_results)

    # Build Edges
    workflow.set_entry_point("search_company")
    workflow.add_edge("search_company", "check_financial_cache")
    workflow.add_edge("check_financial_cache", "fetch_perplexity_data")
    workflow.add_edge("fetch_perplexity_data", "collect_multiple_sources")
    workflow.add_edge("collect_multiple_sources", "normalize_data")
    workflow.add_edge("normalize_data", "validate_and_resolve")
    workflow.add_edge("validate_and_resolve", "calculate_aaoifi")
    workflow.add_edge("calculate_aaoifi", "generate_explanation")
    workflow.add_edge("generate_explanation", "store_results")
    workflow.add_edge("store_results", END)

    # Compile the graph
    app = workflow.compile()
    return app
