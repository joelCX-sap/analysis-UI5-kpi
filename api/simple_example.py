#!/usr/bin/env python3
"""
Simple example of how to use the live HANA query functions
"""

from chat import query_hana_live, ask_llm_with_data, ask_llm_simple

def main():
    print("🚀 ORGANIC VALLEY BI - LIVE HANA CHAT EXAMPLE")
    print("=" * 60)
    
    # Example 1: Simple LLM (no data)
    print("\n1️⃣ SIMPLE LLM (No HANA data)")
    print("-" * 30)
    question1 = "What is procurement in business?"
    print(f"Question: {question1}")
    try:
        response1 = ask_llm_simple(question1)
        print(f"Answer: {response1[:150]}...")
    except Exception as e:
        print(f"Error: {e}")
    
    # Example 2: LLM with live HANA context
    print("\n\n2️⃣ LLM WITH LIVE HANA CONTEXT")
    print("-" * 35)
    question2 = "Tell me about our purchase documents database structure"
    print(f"Question: {question2}")
    try:
        response2 = ask_llm_with_data(question2)
        print(f"Answer: {response2[:150]}...")
    except Exception as e:
        print(f"Error: {e}")
    
    # Example 3: Full live query with data analysis
    print("\n\n3️⃣ FULL LIVE QUERY WITH AI ANALYSIS")
    print("-" * 40)
    question3 = "Analyze our purchase order statistics and provide insights"
    print(f"Question: {question3}")
    try:
        # This function will:
        # 1. Connect to HANA
        # 2. Fetch all 28,988+ records
        # 3. Apply column mapping
        # 4. Calculate statistics
        # 5. Send data to AI for analysis
        # 6. Return comprehensive insights
        response3 = query_hana_live(question3)
        print(f"Analysis: {response3[:200]}...")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "=" * 60)
    print("💡 USAGE SUMMARY:")
    print("- ask_llm_simple(question): Basic AI without data")
    print("- ask_llm_with_data(question): AI with HANA table context")
    print("- query_hana_live(question): Full live query + AI analysis")
    print("\n🔄 All queries fetch fresh data from HANA (no cache)")

if __name__ == "__main__":
    main()
