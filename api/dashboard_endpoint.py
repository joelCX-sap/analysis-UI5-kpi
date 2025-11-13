# Dashboard optimized endpoint with Materials integration
from fastapi import APIRouter
from typing import Dict, Any
import logging
from hana import HanaDataReader
from dashboard_kpis_new import calculate_purchase_kpis
import pandas as pd

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/api/dashboard/kpis")
async def get_dashboard_kpis() -> Dict[str, Any]:
    """
    Enhanced endpoint for dashboard KPIs with Materials data integration.
    Returns comprehensive KPIs using enriched data from Purchase Documents + Materials tables.
    """
    try:
        logger.info("🚀 Fetching enriched dashboard data with Materials")
        
        # Initialize HANA reader
        hana_reader = HanaDataReader()
        
        try:
            # Get enriched data (Purchase Documents + Materials)
            logger.info("📊 Loading enriched Purchase Documents with Materials data...")
            enriched_prepared_data = hana_reader.get_enriched_prepared_data(
                include_technical_names=True
            )
            
            # Convert to DataFrame for KPI calculations
            df = pd.DataFrame(enriched_prepared_data['data'])
            
            if df.empty:
                logger.warning("⚠️ No enriched data available, falling back to Purchase Documents only")
                # Fallback to Purchase Documents only
                prepared_data = hana_reader.get_prepared_data(include_technical_names=True)
                df = pd.DataFrame(prepared_data['data'])
                
                if df.empty:
                    return {"error": "No data available"}
            
            logger.info(f"📊 Processing {len(df)} enriched records for dashboard")
            logger.info(f"📊 Columns available: {len(df.columns)} ({list(df.columns)[:10]}...)")
            
            # Calculate comprehensive KPIs using the enriched data
            kpis = calculate_purchase_kpis(df)
            
            # Add Materials-specific KPIs if Materials data is available
            materials_columns = [col for col in df.columns if any(mat_field in col for mat_field in [
                'Material Description', 'Material Group', 'Material type', 'Product hierarchy'
            ])]
            
            if materials_columns:
                logger.info(f"✅ Materials data detected: {len(materials_columns)} material columns")
                kpis = add_materials_kpis(kpis, df, materials_columns)
            else:
                logger.info("ℹ️ No Materials data columns found, using Purchase Documents only")
            
            # Update metadata to indicate enrichment status
            kpis["summary"]["enriched_with_materials"] = len(materials_columns) > 0
            kpis["summary"]["materials_columns_count"] = len(materials_columns)
            kpis["summary"]["data_source"] = enriched_prepared_data["metadata"]["table_name"]
            kpis["summary"]["schema"] = enriched_prepared_data["metadata"]["schema"]
            
            logger.info("✅ Enhanced dashboard KPIs calculated successfully")
            return kpis
            
        finally:
            hana_reader.disconnect()
        
    except Exception as e:
        logger.error(f"❌ Error calculating enhanced dashboard KPIs: {e}")
        return {"error": str(e)}

def add_materials_kpis(kpis: Dict[str, Any], df: pd.DataFrame, materials_columns: list) -> Dict[str, Any]:
    """
    Add Materials-specific KPIs to the existing KPI structure
    
    Args:
        kpis: Existing KPI structure
        df: DataFrame with enriched data (Purchase Documents + Materials)
        materials_columns: List of detected Materials columns
        
    Returns:
        Enhanced KPI structure with Materials data
    """
    try:
        logger.info("🔧 Adding Materials-specific KPIs...")
        
        # MATERIALS BY TYPE (MTART)
        if 'Material type' in df.columns:
            material_types = df['Material type'].fillna('Unknown').value_counts().head(10).to_dict()
            kpis["material_types"] = {str(k): int(v) for k, v in material_types.items()}
        
        # MATERIAL GROUPS (MATKL)
        if 'Material Group' in df.columns:
            material_groups = df['Material Group'].fillna('Unknown').value_counts().head(10).to_dict()
            kpis["material_groups"] = {str(k): int(v) for k, v in material_groups.items()}
        
        # PRODUCT HIERARCHY (PRDHA)
        if 'Product hierarchy' in df.columns:
            product_hierarchy = df['Product hierarchy'].fillna('Unknown').value_counts().head(10).to_dict()
            kpis["product_hierarchy"] = {str(k): int(v) for k, v in product_hierarchy.items()}
        
        # MATERIALS WITH DESCRIPTIONS (top by volume)
        if all(col in df.columns for col in ['Material Description', 'Purchase Order Quantity (Requested)']):
            def safe_float(x):
                try:
                    return float(x) if x is not None else 0
                except:
                    return 0
            
            material_desc_stats = df.groupby('Material Description').agg({
                'Purchase Order Quantity (Requested)': lambda x: sum(safe_float(v) for v in x),
                'Purchase Order Quantity (Delivered)': lambda x: sum(safe_float(v) for v in x),
                'Purchasing Document Number': 'nunique'
            }).fillna(0).sort_values('Purchase Order Quantity (Requested)', ascending=False).head(10)
            
            kpis["top_materials_by_description"] = {
                str(material)[:50]: {  # Truncate long descriptions
                    "requested_qty": float(stats['Purchase Order Quantity (Requested)']),
                    "delivered_qty": float(stats['Purchase Order Quantity (Delivered)']),
                    "purchase_orders": int(stats['Purchasing Document Number'])
                }
                for material, stats in material_desc_stats.iterrows()
            }
        
        # BASE UNITS OF MEASURE from Materials (MEINS)
        if 'Base Unit of Measure' in df.columns:
            base_uom = df['Base Unit of Measure'].fillna('Unknown').value_counts().head(10).to_dict()
            kpis["base_units_of_measure"] = {str(k): int(v) for k, v in base_uom.items()}
        
        # CROSS-PLANT MATERIAL STATUS
        if 'Cross-plant Material Status' in df.columns:
            material_status = df['Cross-plant Material Status'].fillna('Unknown').value_counts().head(10).to_dict()
            kpis["material_status"] = {str(k): int(v) for k, v in material_status.items()}
        
        # EAN/UPC ANALYSIS
        if 'International Article Number (EAN/UPC)' in df.columns:
            ean_present = df['International Article Number (EAN/UPC)'].notna().sum()
            ean_missing = df['International Article Number (EAN/UPC)'].isna().sum()
            kpis["ean_analysis"] = {
                "with_ean": int(ean_present),
                "without_ean": int(ean_missing),
                "ean_coverage": float(ean_present / (ean_present + ean_missing) * 100) if (ean_present + ean_missing) > 0 else 0
            }
        
        # OLD MATERIAL NUMBERS (BISMT)
        if 'Old material number' in df.columns:
            old_mat_present = df['Old material number'].notna().sum()
            old_mat_missing = df['Old material number'].isna().sum()
            kpis["old_material_numbers"] = {
                "with_old_number": int(old_mat_present),
                "without_old_number": int(old_mat_missing),
                "old_number_usage": float(old_mat_present / (old_mat_present + old_mat_missing) * 100) if (old_mat_present + old_mat_missing) > 0 else 0
            }
        
        logger.info(f"✅ Added {len([k for k in kpis.keys() if k.startswith('material_') or k in ['product_hierarchy', 'top_materials_by_description', 'base_units_of_measure', 'ean_analysis', 'old_material_numbers']])} Materials-specific KPIs")
        
        return kpis
        
    except Exception as e:
        logger.error(f"❌ Error adding Materials KPIs: {e}")
        return kpis  # Return original KPIs if Materials enhancement fails
