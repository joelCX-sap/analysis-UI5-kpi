#############################################################################
# GEN AI HUB SETUP
#############################################################################
from dotenv import load_dotenv

load_dotenv()

from gen_ai_hub.proxy.core.proxy_clients import get_proxy_client

proxy_client = get_proxy_client("gen-ai-hub")  # for an AI Core proxy

from langchain.prompts import PromptTemplate

#############################################################################
# HANA DATA INTEGRATION
#############################################################################
import json
import pandas as pd
import sys
import os

# Add the parent directory to the path to import hana module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hana import HanaDataReader

class DataQueryAgent:
    def __init__(self):
        """Initialize the Data Query Agent with HANA data access"""
        self.hana_reader = HanaDataReader()
    
    def get_live_data_context(self):
        """Get live context about available data directly from HANA"""
        try:
            # Get table info directly from HANA
            table_info = self.hana_reader.get_table_info()
            column_mapping = self.hana_reader.get_column_mapping()
            
            # Get mapped column names
            mapped_columns = list(column_mapping.values()) if column_mapping else table_info['columns']
            
            context = f"""
LIVE DATA CONTEXT FROM HANA:
- Source Table: {table_info['schema']}.{table_info['table_name']}
- Total Records: {table_info['row_count']:,}
- Total Columns: {table_info['column_count']}
- Available Columns: {', '.join(mapped_columns)}

TECHNICAL COLUMNS MAPPING:
{json.dumps(column_mapping, indent=2) if column_mapping else 'No column mapping available'}

This is real-time Purchase Documents data from SAP HANA containing information about procurement orders, materials, delivery dates, plants, and related business data.
Connection is live and data will be fetched directly from HANA for each query.
"""
            return context, table_info, column_mapping
            
        except Exception as e:
            error_msg = f"Error connecting to HANA: {str(e)}"
            return error_msg, None, None
    
    def query_live_data(self, query_description: str):
        """Query live data directly from HANA based on natural language description"""
        try:
            # Get fresh data from HANA
            print(f"🔄 Fetching live data from HANA for query: {query_description}")
            
            # Read all data directly from HANA
            raw_data = self.hana_reader.read_all_data()
            
            # Apply column mapping
            mapped_data = self.hana_reader.apply_column_mapping(raw_data)
            
            # Get basic statistics from live data
            total_records = len(mapped_data)
            unique_plants = mapped_data['Plant'].nunique() if 'Plant' in mapped_data.columns else 0
            unique_materials = mapped_data['Material Number'].nunique() if 'Material Number' in mapped_data.columns else 0
            unique_companies = mapped_data['Company Code'].nunique() if 'Company Code' in mapped_data.columns else 0
            
            # Date range analysis
            date_range = "N/A"
            date_columns = ['Document Date in Document', 'Delivery Date (Requested)', 'Delivery Date (Actual)']
            for date_col in date_columns:
                if date_col in mapped_data.columns:
                    try:
                        dates = pd.to_datetime(mapped_data[date_col], errors='coerce').dropna()
                        if not dates.empty:
                            date_range = f"{dates.min().strftime('%Y-%m-%d')} to {dates.max().strftime('%Y-%m-%d')}"
                            break
                    except:
                        continue
            
            # Sample records for context
            sample_records = mapped_data.head(3).to_dict('records') if not mapped_data.empty else []
            
            query_result = f"""
LIVE QUERY RESULT FROM HANA: "{query_description}"

CURRENT DATASET STATISTICS:
- Total Records: {total_records:,}
- Unique Plants: {unique_plants}
- Unique Materials: {unique_materials}
- Unique Companies: {unique_companies}
- Date Range: {date_range}

AVAILABLE COLUMNS:
{', '.join(mapped_data.columns.tolist())}

SAMPLE DATA (first 3 records):
{json.dumps(sample_records, indent=2, default=str)}
"""
            
            # Close connection
            self.hana_reader.disconnect()
            
            return query_result, mapped_data
            
        except Exception as e:
            error_msg = f"Error querying live data from HANA: {str(e)}"
            # Ensure connection is closed even on error
            try:
                self.hana_reader.disconnect()
            except:
                pass
            return error_msg, None

# Global instance
data_agent = DataQueryAgent()

#############################################################################
# SIMPLE LLM FUNCTION 
#############################################################################
from gen_ai_hub.proxy.langchain.openai import ChatOpenAI


def ask_llm_simple(prompt: str) -> str:
    """Simple LLM function - original functionality preserved"""
    # Invoke the LLM (gpt-4.1 via the AI Core proxy) with the provided prompt
    llm = ChatOpenAI(proxy_model_name="gpt-4.1", proxy_client=proxy_client)
    response = llm.invoke(prompt).content
    return response


def ask_llm_with_data(user_query: str) -> str:
    """Enhanced LLM function that includes live HANA data context"""
    
    # Get live data context directly from HANA
    data_context, table_info, column_mapping = data_agent.get_live_data_context()
    
    # Create enhanced prompt with live data context
    enhanced_prompt = f"""
You are a Business Intelligence Assistant with access to live Purchase Documents data from SAP HANA.

{data_context}

USER QUERY: {user_query}

Please provide a comprehensive response based on the live data context above. If the user is asking for specific data analysis, calculations, or insights, use the real-time information provided. Always respond in English.

If the query requires specific data filtering or calculations, indicate that fresh data will be fetched from HANA to provide accurate results.
"""
    
    # Invoke the LLM with enhanced context
    llm = ChatOpenAI(proxy_model_name="gpt-4.1", proxy_client=proxy_client)
    response = llm.invoke(enhanced_prompt).content
    return response


def query_purchase_data(question: str) -> str:
    """Specialized function to query live purchase documents data from HANA"""
    
    # Get live data insights directly from HANA
    data_result, live_data = data_agent.query_live_data(question)
    
    # Create prompt for LLM to interpret and enhance the live data result
    analysis_prompt = f"""
You are a Business Intelligence Analyst. Based on the following LIVE data query result from SAP HANA, provide insights and analysis in English.

LIVE DATA QUERY RESULT:
{data_result}

ORIGINAL QUESTION: {question}

Please provide:
1. Direct answer to the question based on the current live data from HANA
2. Key insights from the real-time data
3. Recommendations for further analysis if applicable
4. Any notable patterns or trends you can identify from the live dataset

Note: This data was fetched in real-time from HANA, so all statistics and insights reflect the current state of the database.

Respond in a professional, analytical tone suitable for business stakeholders.
"""
    
    # Get LLM analysis
    llm = ChatOpenAI(proxy_model_name="gpt-4.1", proxy_client=proxy_client)
    analysis = llm.invoke(analysis_prompt).content
    
    return analysis


def query_hana_live(question: str) -> str:
    """Main function to query HANA database in real-time and get AI analysis"""
    
    print(f"🚀 Processing live query: {question}")
    
    try:
        # Query live data from HANA
        data_result, live_data = data_agent.query_live_data(question)
        
        if live_data is not None and not live_data.empty:
            # Create comprehensive prompt with live data
            analysis_prompt = f"""
You are an expert Business Intelligence Analyst with access to live SAP HANA Purchase Documents data.

LIVE DATA CONTEXT:
{data_result}

USER QUESTION: {question}

Based on the real-time data fetched from HANA above, please provide:

1. DIRECT ANSWER: Address the specific question using the live data
2. KEY METRICS: Highlight important numbers and statistics
3. INSIGHTS: Identify patterns, trends, or notable findings
4. BUSINESS IMPACT: Explain what these findings mean for the business
5. RECOMMENDATIONS: Suggest next steps or areas for further investigation

IMPORTANT: All your analysis should be based on the live data shown above, which contains {len(live_data):,} current records from the HANA database.

Respond in English with a professional, analytical tone suitable for business executives.
"""
            
            # Get comprehensive AI analysis
            llm = ChatOpenAI(proxy_model_name="gpt-4.1", proxy_client=proxy_client)
            analysis = llm.invoke(analysis_prompt).content
            
            print(f"✅ Analysis completed for {len(live_data):,} live records")
            return analysis
            
        else:
            # Handle error case
            error_prompt = f"""
There was an issue querying the HANA database for the question: "{question}"

Error details: {data_result}

Please provide a helpful response explaining that there was a technical issue accessing the live data, and suggest alternative approaches or recommend checking the database connection.

Respond in English in a professional tone.
"""
            
            llm = ChatOpenAI(proxy_model_name="gpt-4.1", proxy_client=proxy_client)
            response = llm.invoke(error_prompt).content
            return response
            
    except Exception as e:
        print(f"❌ Error in live query: {e}")
        return f"I apologize, but there was an error accessing the live HANA data: {str(e)}. Please check the database connection and try again."
