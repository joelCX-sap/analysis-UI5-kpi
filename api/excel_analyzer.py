#############################################################################
# EXCEL ANALYZER WITH LLM INTEGRATION
#############################################################################
from dotenv import load_dotenv
import os
import json
import pandas as pd
import tempfile
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

load_dotenv()

from gen_ai_hub.proxy.core.proxy_clients import get_proxy_client
from gen_ai_hub.proxy.langchain.openai import ChatOpenAI

# Initialize AI Core proxy
proxy_client = get_proxy_client("gen-ai-hub")

class ExcelAnalyzer:
    def __init__(self):
        """Initialize Excel Analyzer with LLM capabilities"""
        self.uploaded_files = {}  # Store uploaded file data in memory
        self.llm = ChatOpenAI(proxy_model_name="gpt-4.1", proxy_client=proxy_client)
    
    def upload_excel_file(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Upload and process an Excel file
        
        Args:
            file_content: Raw bytes of the Excel file
            filename: Original filename
            
        Returns:
            Dict with file_id, metadata, and preview data
        """
        try:
            # Generate unique file ID
            file_id = str(uuid.uuid4())
            
            # Save to temporary file for processing
            with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name
            
            # Read Excel file with pandas
            excel_data = pd.read_excel(temp_file_path, sheet_name=None)  # Read all sheets
            
            # Clean up temp file
            os.unlink(temp_file_path)
            
            # Analyze file structure
            file_metadata = {
                'file_id': file_id,
                'filename': filename,
                'upload_time': datetime.now().isoformat(),
                'sheets': {},
                'total_rows': 0,
                'total_columns': 0
            }
            
            processed_data = {}
            
            for sheet_name, df in excel_data.items():
                # Clean the dataframe
                df = df.dropna(how='all').dropna(axis=1, how='all')  # Remove empty rows/columns
                
                # Replace NaN values with None for JSON compatibility
                df = df.replace({pd.NA: None, pd.NaT: None})
                df = df.where(pd.notnull(df), None)
                
                # Get sample data with NaN handling
                sample_data = []
                if not df.empty:
                    sample_df = df.head(5)
                    # Convert to dict and handle any remaining NaN values
                    sample_data = sample_df.to_dict('records')
                    # Clean up any NaN values that might remain
                    for record in sample_data:
                        for key, value in record.items():
                            if pd.isna(value) if pd.api.types.is_scalar(value) else False:
                                record[key] = None
                
                sheet_info = {
                    'name': sheet_name,
                    'rows': len(df),
                    'columns': len(df.columns),
                    'column_names': df.columns.tolist(),
                    'data_types': df.dtypes.astype(str).to_dict(),
                    'sample_data': sample_data
                }
                
                file_metadata['sheets'][sheet_name] = sheet_info
                file_metadata['total_rows'] += len(df)
                file_metadata['total_columns'] += len(df.columns)
                
                # Store the actual data
                processed_data[sheet_name] = df
            
            # Store in memory
            self.uploaded_files[file_id] = {
                'metadata': file_metadata,
                'data': processed_data,
                'filename': filename
            }
            
            return {
                'success': True,
                'file_id': file_id,
                'metadata': file_metadata,
                'message': f'Excel file "{filename}" uploaded successfully with {len(excel_data)} sheet(s)'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Error processing Excel file: {str(e)}',
                'message': f'Failed to process "{filename}"'
            }
    
    def get_file_summary(self, file_id: str) -> Dict[str, Any]:
        """Get comprehensive summary of uploaded Excel file"""
        if file_id not in self.uploaded_files:
            return {'success': False, 'error': 'File not found'}
        
        file_info = self.uploaded_files[file_id]
        metadata = file_info['metadata']
        
        # Generate AI summary of the file structure and content
        summary_prompt = f"""
Analyze this Excel file structure and provide a comprehensive summary in English:

FILE: {metadata['filename']}
UPLOADED: {metadata['upload_time']}
TOTAL SHEETS: {len(metadata['sheets'])}
TOTAL ROWS: {metadata['total_rows']:,}
TOTAL COLUMNS: {metadata['total_columns']}

SHEET DETAILS:
{json.dumps(metadata['sheets'], indent=2)}

Please provide:
1. OVERVIEW: What type of data does this file contain?
2. STRUCTURE: Describe the organization and sheets
3. DATA QUALITY: Comment on completeness and structure
4. POTENTIAL INSIGHTS: What kinds of analysis could be performed?
5. RECOMMENDATIONS: Suggest specific questions users could ask

Format your response as a clear, business-friendly summary.
"""
        
        try:
            ai_summary = self.llm.invoke(summary_prompt).content
            
            return {
                'success': True,
                'file_id': file_id,
                'metadata': metadata,
                'ai_summary': ai_summary
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error generating AI summary: {str(e)}'
            }
    
    def analyze_excel_data(self, file_id: str, question: str, sheet_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze Excel data using LLM to answer specific questions
        
        Args:
            file_id: ID of uploaded file
            question: User question about the data
            sheet_name: Optional specific sheet to analyze
            
        Returns:
            Dict with analysis results
        """
        if file_id not in self.uploaded_files:
            return {'success': False, 'error': 'File not found'}
        
        try:
            file_info = self.uploaded_files[file_id]
            metadata = file_info['metadata']
            data = file_info['data']
            
            # Determine which sheet(s) to analyze
            sheets_to_analyze = [sheet_name] if sheet_name and sheet_name in data else list(data.keys())
            
            # Prepare data context for LLM
            data_context = f"""
EXCEL FILE ANALYSIS: {metadata['filename']}
QUESTION: {question}

FILE STRUCTURE:
- Total Sheets: {len(metadata['sheets'])}
- Total Rows: {metadata['total_rows']:,}
- Upload Time: {metadata['upload_time']}

"""
            
            # Add detailed data for each sheet being analyzed
            for sheet in sheets_to_analyze:
                if sheet in data:
                    df = data[sheet]
                    sheet_info = metadata['sheets'][sheet]
                    
                    data_context += f"""
SHEET: {sheet}
- Rows: {len(df):,}
- Columns: {len(df.columns)}
- Column Names: {', '.join(df.columns.tolist())}

SAMPLE DATA (first 10 rows):
{df.head(10).to_string()}

DATA TYPES:
{df.dtypes.to_string()}

BASIC STATISTICS:
{df.describe(include='all').to_string()}

"""
            
            # Create comprehensive analysis prompt
            analysis_prompt = f"""
You are an expert Data Analyst. Based on the Excel data provided below, answer the user's question with detailed analysis.

{data_context}

USER QUESTION: {question}

Please provide a comprehensive analysis including:

1. DIRECT ANSWER: Address the specific question asked
2. KEY FINDINGS: Highlight important discoveries from the data
3. DATA INSIGHTS: Identify patterns, trends, or anomalies
4. STATISTICS: Provide relevant calculations and metrics
5. RECOMMENDATIONS: Suggest actionable next steps
6. ADDITIONAL QUESTIONS: Suggest related questions for deeper analysis

Use the actual data shown above to support your analysis. Be specific with numbers, percentages, and concrete examples from the dataset.

Respond in English with a professional, analytical tone suitable for business stakeholders.
"""
            
            # Get AI analysis
            analysis = self.llm.invoke(analysis_prompt).content
            
            return {
                'success': True,
                'file_id': file_id,
                'filename': metadata['filename'],
                'question': question,
                'sheets_analyzed': sheets_to_analyze,
                'analysis': analysis,
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Error analyzing Excel data: {str(e)}'
            }
    
    def get_file_data_preview(self, file_id: str, sheet_name: str, rows: int = 20) -> Dict[str, Any]:
        """Get preview of specific sheet data"""
        if file_id not in self.uploaded_files:
            return {'success': False, 'error': 'File not found'}
        
        file_info = self.uploaded_files[file_id]
        data = file_info['data']
        
        if sheet_name not in data:
            return {'success': False, 'error': f'Sheet "{sheet_name}" not found'}
        
        df = data[sheet_name]
        preview_df = df.head(rows)
        
        # Convert to dict and handle NaN values
        preview_data = preview_df.to_dict('records')
        
        # Clean up any NaN values for JSON compatibility
        for record in preview_data:
            for key, value in record.items():
                if pd.isna(value) if pd.api.types.is_scalar(value) else False:
                    record[key] = None
        
        return {
            'success': True,
            'file_id': file_id,
            'sheet_name': sheet_name,
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'columns': df.columns.tolist(),
            'preview_data': preview_data,
            'rows_shown': min(rows, len(df))
        }
    
    def list_uploaded_files(self) -> Dict[str, Any]:
        """List all uploaded files"""
        files_list = []
        
        for file_id, file_info in self.uploaded_files.items():
            metadata = file_info['metadata']
            files_list.append({
                'file_id': file_id,
                'filename': metadata['filename'],
                'upload_time': metadata['upload_time'],
                'sheets_count': len(metadata['sheets']),
                'total_rows': metadata['total_rows'],
                'total_columns': metadata['total_columns']
            })
        
        return {
            'success': True,
            'files': files_list,
            'total_files': len(files_list)
        }
    
    def delete_file(self, file_id: str) -> Dict[str, Any]:
        """Delete uploaded file from memory"""
        if file_id not in self.uploaded_files:
            return {'success': False, 'error': 'File not found'}
        
        filename = self.uploaded_files[file_id]['filename']
        del self.uploaded_files[file_id]
        
        return {
            'success': True,
            'message': f'File "{filename}" deleted successfully'
        }

# Global instance
excel_analyzer = ExcelAnalyzer()
