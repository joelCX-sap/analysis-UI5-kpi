"""
Endpoint optimizado para Dashboard KPIs basado en Purchase Documents schema
"""
import pandas as pd
import logging
from datetime import datetime
from typing import Dict, Any

logger = logging.getLogger(__name__)

def calculate_purchase_kpis(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Calcula KPIs específicos para Purchase Documents usando el schema correcto
    """
    try:
        logger.info(f"📊 Calculating KPIs for {len(df)} Purchase Documents")
        
        # Inicializar estructura de KPIs
        kpis = {
            "summary": {
                "total_records": len(df),
                "total_purchase_documents": 0,
                "unique_companies": 0,
                "unique_plants": 0,
                "unique_materials": 0,
                "total_requested_quantity": 0,
                "total_delivered_quantity": 0
            },
            "company_analysis": {},
            "delivery_completion": {},
            "plant_performance": {},
            "delivery_time_trends": {},
            "document_types": {},
            "material_analysis": {},
            "on_time_delivery": {},
            "lead_time_analysis": {},
            "deletion_stats": {},
            "status_distribution": {},
            "category_distribution": {},
            "movement_types": {},
            "uom_distribution": {},
            "open_orders_aging": {},
            "material_fill_rate": {},
            "freshness_analysis": {}
        }
        
        # SUMMARY METRICS (usando nombres legibles)
        if 'Purchasing Document Number' in df.columns:
            kpis["summary"]["total_purchase_documents"] = df['Purchasing Document Number'].nunique()
            
        if 'Company Code' in df.columns:
            kpis["summary"]["unique_companies"] = df['Company Code'].nunique()
            
        if 'Plant' in df.columns:
            kpis["summary"]["unique_plants"] = df['Plant'].nunique()
            
        if 'Material Number' in df.columns:
            kpis["summary"]["unique_materials"] = df['Material Number'].nunique()
            
        if 'Purchase Order Quantity (Requested)' in df.columns:
            # Convertir Decimal a float
            requested_qty = df['Purchase Order Quantity (Requested)'].fillna(0)
            kpis["summary"]["total_requested_quantity"] = float(sum(float(x) if x else 0 for x in requested_qty))
            
        if 'Purchase Order Quantity (Delivered)' in df.columns:
            # Convertir Decimal a float
            delivered_qty = df['Purchase Order Quantity (Delivered)'].fillna(0)
            kpis["summary"]["total_delivered_quantity"] = float(sum(float(x) if x else 0 for x in delivered_qty))
        
        # COMPANY ANALYSIS (Company Code) - Solo si hay más de una empresa
        if 'Company Code' in df.columns and kpis["summary"]["unique_companies"] > 1:
            def safe_float(x):
                try:
                    return float(x) if x is not None else 0
                except:
                    return 0
            
            company_stats = df.groupby('Company Code').agg({
                'Purchasing Document Number': 'nunique',
                'Purchase Order Quantity (Requested)': lambda x: sum(safe_float(v) for v in x),
                'Purchase Order Quantity (Delivered)': lambda x: sum(safe_float(v) for v in x)
            }).fillna(0).sort_values('Purchasing Document Number', ascending=False).head(10)
            
            kpis["company_analysis"] = {
                str(company): {
                    "purchase_orders": int(stats['Purchasing Document Number']),
                    "requested_qty": float(stats['Purchase Order Quantity (Requested)']),
                    "delivered_qty": float(stats['Purchase Order Quantity (Delivered)']),
                    "delivery_rate": float(stats['Purchase Order Quantity (Delivered)'] / stats['Purchase Order Quantity (Requested)'] * 100) if stats['Purchase Order Quantity (Requested)'] > 0 else 0
                }
                for company, stats in company_stats.iterrows()
            }
        else:
            # Si solo hay una empresa, no mostrar company analysis
            kpis["company_analysis"] = {}
        
        # DELIVERY COMPLETION ("Delivery Completed" Indicator)
        if '"Delivery Completed" Indicator' in df.columns:
            delivery_counts = df['"Delivery Completed" Indicator'].fillna('').value_counts().to_dict()
            kpis["delivery_completion"] = {
                str(k): int(v) for k, v in delivery_counts.items()
            }
        
        # PLANT PERFORMANCE (Plant)
        if 'Plant' in df.columns and 'Purchase Order Quantity (Requested)' in df.columns:
            def safe_float(x):
                try:
                    return float(x) if x is not None else 0
                except:
                    return 0
            
            plant_stats = df.groupby('Plant').agg({
                'Purchasing Document Number': 'nunique',
                'Purchase Order Quantity (Requested)': lambda x: sum(safe_float(v) for v in x),
                'Purchase Order Quantity (Delivered)': lambda x: sum(safe_float(v) for v in x),
                'Actual Delivery Time in Days': 'mean'
            }).fillna(0).sort_values('Purchase Order Quantity (Requested)', ascending=False).head(15)
            
            kpis["plant_performance"] = {
                str(plant): {
                    "purchase_orders": int(stats['Purchasing Document Number']),
                    "requested_qty": float(stats['Purchase Order Quantity (Requested)']),
                    "delivered_qty": float(stats['Purchase Order Quantity (Delivered)']),
                    "avg_delivery_days": float(stats['Actual Delivery Time in Days']) if stats['Actual Delivery Time in Days'] > 0 else 0
                }
                for plant, stats in plant_stats.iterrows()
            }
        
        # DELIVERY TIME TRENDS (usando Delivery Date (Actual))
        if 'Delivery Date (Actual)' in df.columns and 'Actual Delivery Time in Days' in df.columns:
            df_dates = df.copy()
            df_dates['Delivery Date (Actual)'] = pd.to_datetime(df_dates['Delivery Date (Actual)'], errors='coerce')
            df_dates = df_dates.dropna(subset=['Delivery Date (Actual)', 'Actual Delivery Time in Days'])
            
            if not df_dates.empty:
                df_dates['month'] = df_dates['Delivery Date (Actual)'].dt.to_period('M')
                monthly_delivery = df_dates.groupby('month')['Actual Delivery Time in Days'].agg(['mean', 'count', 'std']).fillna(0)
                monthly_delivery = monthly_delivery.tail(12)  # Últimos 12 meses
                
                kpis["delivery_time_trends"] = {
                    str(month): {
                        "avg_days": float(stats['mean']),
                        "order_count": int(stats['count']),
                        "std_dev": float(stats['std'])
                    }
                    for month, stats in monthly_delivery.iterrows()
                }
        
        # DOCUMENT TYPES (Purchasing Document Type)
        if 'Purchasing Document Type' in df.columns:
            doc_types = df['Purchasing Document Type'].fillna('Unknown').value_counts().head(10).to_dict()
            kpis["document_types"] = {
                str(k): int(v) for k, v in doc_types.items()
            }
        
        # MATERIAL ANALYSIS (top materials by volumen)
        if 'Material Number' in df.columns and 'Purchase Order Quantity (Requested)' in df.columns:
            def safe_float(x):
                try:
                    return float(x) if x is not None else 0
                except:
                    return 0
            
            material_stats = df.groupby('Material Number').agg({
                'Purchase Order Quantity (Requested)': lambda x: sum(safe_float(v) for v in x),
                'Purchase Order Quantity (Delivered)': lambda x: sum(safe_float(v) for v in x),
                'Purchasing Document Number': 'nunique'
            }).fillna(0).sort_values('Purchase Order Quantity (Requested)', ascending=False).head(10)
            
            kpis["material_analysis"] = {
                str(material): {
                    "requested_qty": float(stats['Purchase Order Quantity (Requested)']),
                    "delivered_qty": float(stats['Purchase Order Quantity (Delivered)']),
                    "purchase_orders": int(stats['Purchasing Document Number'])
                }
                for material, stats in material_stats.iterrows()
            }

            # MATERIAL FILL RATE (por material)
            try:
                mat_fill = df.groupby('Material Number').agg({
                    'Purchase Order Quantity (Requested)': lambda x: sum(safe_float(v) for v in x),
                    'Purchase Order Quantity (Delivered)': lambda x: sum(safe_float(v) for v in x)
                }).fillna(0)
                fill_rate = (
                    mat_fill['Purchase Order Quantity (Delivered)'] / 
                    mat_fill['Purchase Order Quantity (Requested)']
                ).replace([pd.NA, pd.NaT], 0).fillna(0)
                # Top 10 materiales con menor fill rate
                lowest = fill_rate.sort_values().head(10)
                kpis["material_fill_rate"] = {
                    str(mat): {
                        "fill_rate": float(rate) if pd.notna(rate) else 0,
                        "requested_qty": float(mat_fill.loc[mat, 'Purchase Order Quantity (Requested)']),
                        "delivered_qty": float(mat_fill.loc[mat, 'Purchase Order Quantity (Delivered)'])
                    }
                    for mat, rate in lowest.items()
                }
            except Exception as _:
                kpis["material_fill_rate"] = {}
        
        # ON-TIME DELIVERY (Actual vs Requested)
        if 'Delivery Date (Requested)' in df.columns and 'Delivery Date (Actual)' in df.columns:
            df_dt = df.copy()
            df_dt['Delivery Date (Requested)'] = pd.to_datetime(df_dt['Delivery Date (Requested)'], errors='coerce')
            df_dt['Delivery Date (Actual)'] = pd.to_datetime(df_dt['Delivery Date (Actual)'], errors='coerce')
            df_dt = df_dt.dropna(subset=['Delivery Date (Requested)', 'Delivery Date (Actual)'])
            total = len(df_dt)
            on_time = int((df_dt['Delivery Date (Actual)'] <= df_dt['Delivery Date (Requested)']).sum())
            late = int((df_dt['Delivery Date (Actual)'] > df_dt['Delivery Date (Requested)']).sum())
            delays = (df_dt['Delivery Date (Actual)'] - df_dt['Delivery Date (Requested)']).dt.days
            avg_delay = float(delays[delays > 0].mean()) if not delays.empty else 0.0
            kpis["on_time_delivery"] = {
                "total_evaluated": total,
                "on_time": on_time,
                "late": late,
                "on_time_rate": float(on_time / total * 100) if total > 0 else 0,
                "avg_delay_days": avg_delay
            }
        
        # LEAD TIME ANALYSIS (planned vs actual)
        if 'Planned Delivery Time in Days' in df.columns and 'Actual Delivery Time in Days' in df.columns:
            def safe_float(x):
                try:
                    return float(x) if x is not None else 0
                except:
                    return 0
            planned = df['Planned Delivery Time in Days'].apply(safe_float)
            actual = df['Actual Delivery Time in Days'].apply(safe_float)
            kpis["lead_time_analysis"] = {
                "avg_planned_days": float(planned.mean()) if len(planned) else 0,
                "avg_actual_days": float(actual.mean()) if len(actual) else 0,
                "avg_variance_days": float((actual - planned).mean()) if len(actual) else 0
            }
        
        # DELETION STATS (LOEKZ)
        if 'Deletion Indicator in Purchasing Document' in df.columns:
            del_counts = df['Deletion Indicator in Purchasing Document'].fillna('').value_counts().to_dict()
            kpis["deletion_stats"] = {str(k): int(v) for k, v in del_counts.items()}
        
        # STATUS DISTRIBUTION (STATU)
        if 'Status of Purchasing Document' in df.columns:
            status_counts = df['Status of Purchasing Document'].fillna('Unknown').value_counts().head(10).to_dict()
            kpis["status_distribution"] = {str(k): int(v) for k, v in status_counts.items()}
        
        # CATEGORY DISTRIBUTION (BSTYP)
        if 'Purchasing Document Category' in df.columns:
            cat_counts = df['Purchasing Document Category'].fillna('Unknown').value_counts().head(10).to_dict()
            kpis["category_distribution"] = {str(k): int(v) for k, v in cat_counts.items()}
        
        # MOVEMENT TYPES (BWART)
        if 'Movement type (inventory management)' in df.columns:
            mv_counts = df['Movement type (inventory management)'].fillna('Unknown').value_counts().head(10).to_dict()
            kpis["movement_types"] = {str(k): int(v) for k, v in mv_counts.items()}
        
        # UOM DISTRIBUTION (MEINS)
        if 'Purchase Order Unit of Measure' in df.columns:
            uom_counts = df['Purchase Order Unit of Measure'].fillna('Unknown').value_counts().head(10).to_dict()
            kpis["uom_distribution"] = {str(k): int(v) for k, v in uom_counts.items()}
        
        # OPEN ORDERS AGING (ELIKZ='' agrupado por rango de días desde BEDAT)
        if '"Delivery Completed" Indicator' in df.columns and 'Purchasing Document Date' in df.columns:
            df_open = df[(df['"Delivery Completed" Indicator'].fillna('') == '')].copy()
            df_open['Purchasing Document Date'] = pd.to_datetime(df_open['Purchasing Document Date'], errors='coerce')
            df_open = df_open.dropna(subset=['Purchasing Document Date'])
            today = pd.Timestamp(datetime.now().date())
            days_open = (today - df_open['Purchasing Document Date']).dt.days
            buckets = {"0-30": 0, "31-60": 0, "61-90": 0, "90+": 0}
            for d in days_open:
                if d <= 30: buckets["0-30"] += 1
                elif d <= 60: buckets["31-60"] += 1
                elif d <= 90: buckets["61-90"] += 1
                else: buckets["90+"] += 1
            kpis["open_orders_aging"] = buckets
        
        # FRESHNESS ANALYSIS (HSDAT vs Delivery Date Actual)
        if 'Date of Manufacture' in df.columns and 'Delivery Date (Actual)' in df.columns:
            df_fr = df.copy()
            df_fr['Date of Manufacture'] = pd.to_datetime(df_fr['Date of Manufacture'], errors='coerce')
            df_fr['Delivery Date (Actual)'] = pd.to_datetime(df_fr['Delivery Date (Actual)'], errors='coerce')
            df_fr = df_fr.dropna(subset=['Date of Manufacture', 'Delivery Date (Actual)'])
            if not df_fr.empty:
                freshness_days = (df_fr['Delivery Date (Actual)'] - df_fr['Date of Manufacture']).dt.days
                kpis["freshness_analysis"] = {
                    "avg_days": float(freshness_days.mean()),
                    "min_days": int(freshness_days.min()),
                    "max_days": int(freshness_days.max()),
                    "evaluated": int(len(freshness_days))
                }
        
        logger.info("✅ KPIs calculated successfully")
        return kpis
        
    except Exception as e:
        logger.error(f"❌ Error calculating KPIs: {e}")
        raise e
