# Organic Valley BI - Lector de Datos HANA

Este proyecto proporciona un módulo completo para leer datos de HANA Cloud, mapear columnas técnicas a nombres legibles y preparar los datos para consumo en aplicaciones.

## 📋 Características

- ✅ Conexión a HANA Cloud usando `hana_ml`
- ✅ Lectura de datos de la tabla `PurchaseDocuments`
- ✅ Mapeo automático de columnas técnicas a nombres legibles
- ✅ Generación de datos preparados en formato JSON
- ✅ Funciones de filtrado y análisis de datos
- ✅ Ejemplo completo de consumo para aplicaciones

## 📊 Datos Procesados

- **Tabla fuente**: `COEAI.PurchaseDocuments`
- **Total registros**: 28,988
- **Total columnas**: 24
- **Rango de fechas**: 2024-03-25 a 2025-02-07
- **Empresas únicas**: 1
- **Plantas únicas**: 36
- **Materiales únicos**: 164

## 🏗️ Estructura del Proyecto

```
.
├── hana.py                 # Módulo principal de conexión y procesamiento
├── annotations.json        # Mapeo de columnas técnicas a nombres legibles
├── .env                   # Credenciales de conexión a HANA
├── prepared_data.json     # Datos procesados y listos para consumo (31.5MB)
├── ejemplo_consumo.py     # Ejemplo de cómo usar los datos en aplicaciones
├── test.ipynb            # Notebook de pruebas originales
└── README.md             # Este archivo
```

## ⚙️ Configuración

### 1. Credenciales (.env)


```

### 2. Dependencias

```bash
pip install hana-ml pandas python-dotenv
```

## 🚀 Uso

### Procesamiento de Datos

```python
from hana import HanaDataReader

# Inicializar el lector
reader = HanaDataReader()

# Obtener datos preparados
prepared_data = reader.get_prepared_data()

# Guardar en archivo JSON
reader.save_prepared_data('prepared_data.json')

# Cerrar conexión
reader.disconnect()
```

### Consumo de Datos Preparados

```python
import json
import pandas as pd

# Cargar datos preparados
with open('prepared_data.json', 'r') as f:
    data = json.load(f)

# Convertir a DataFrame
df = pd.DataFrame(data['data'])

# Filtrar por planta específica
plant_data = df[df['Plant'] == 1034]

# Análisis básico
print(f"Total registros: {len(df):,}")
print(f"Columnas: {list(df.columns)}")
```

## 📊 Mapeo de Columnas

Las columnas técnicas se mapean automáticamente usando `annotations.json`:

| Nombre Técnico | Nombre Legible |
|---------------|----------------|
| MANDT | Client |
| EBELN | Purchasing Document Number |
| EBELP | Item Number of Purchasing Document |
| BUKRS | Company Code |
| WERKS | Plant |
| MATNR | Material Number |
| MENGE | Purchase Order Quantity (Requested) |
| EINDT | Delivery Date (Requested) |
| ... | ... |

## 🔄 Estructura de Datos Preparados

```json
{
  "metadata": {
    "total_records": 28988,
    "columns_count": 24,
    "last_updated": "2025-09-27T09:15:23.616085",
    "table_name": "PurchaseDocuments",
    "schema": "COEAI",
    "original_columns": ["MANDT", "EBELN", ...],
    "mapped_columns": ["Client", "Purchasing Document Number", ...]
  },
  "column_mapping": {
    "MANDT": "Client",
    "EBELN": "Purchasing Document Number",
    ...
  },
  "data": [
    {
      "Client": 110,
      "Purchasing Document Number": 4500001887,
      "Company Code": 1710,
      "Plant": 1034,
      "Material Number": "000000000000100679",
      ...
    },
    ...
  ]
}
```

## 🧪 Pruebas y Ejemplos

### Ejecutar el procesamiento completo:
```bash
python hana.py
```

### Probar el consumo de datos:
```bash
python ejemplo_consumo.py
```

## 📈 Funcionalidades del Módulo HanaDataReader

### Métodos Principales

- `connect()`: Establece conexión con HANA Cloud
- `read_all_data(table_name, schema)`: Lee todos los datos de una tabla
- `get_table_info(table_name, schema)`: Obtiene información de la tabla
- `get_column_mapping()`: Obtiene el mapeo de columnas
- `apply_column_mapping(df)`: Aplica mapeo a un DataFrame
- `get_prepared_data()`: Genera datos preparados para consumo
- `save_prepared_data(output_file)`: Guarda datos en archivo JSON
- `disconnect()`: Cierra la conexión

### Funciones de Consumo (ejemplo_consumo.py)

- `load_prepared_data(file_path)`: Carga datos desde JSON
- `get_data_summary(prepared_data)`: Obtiene resumen de los datos
- `filter_data(prepared_data, filters)`: Filtra datos por criterios
- `get_analytics(prepared_data)`: Análisis básico de los datos

## 🎯 Casos de Uso

1. **Dashboard de BI**: Consumir datos para visualizaciones
2. **Análisis de compras**: Estudiar patrones de procurement
3. **Reportes automáticos**: Generar informes periódicos
4. **APIs de datos**: Servir datos a aplicaciones web
5. **Machine Learning**: Usar datos para modelos predictivos

## 🔒 Seguridad

- Las credenciales están en archivo `.env` (no incluir en control de versiones)
- Conexión segura a HANA Cloud con SSL
- Validación de credenciales antes de conexión

## 📝 Logs y Debugging

El módulo incluye logging completo:

```
INFO:__main__:Conexión a HANA establecida exitosamente
INFO:__main__:Leyendo datos de la tabla: COEAI.PurchaseDocuments
INFO:__main__:Se leyeron 28988 registros de COEAI.PurchaseDocuments
INFO:__main__:Se mapearon 24 columnas
INFO:__main__:Datos preparados guardados en: prepared_data.json
```

## 🚀 Próximos Pasos

1. **Automatización**: Configurar actualizaciones automáticas de datos
2. **Cache**: Implementar cache para mejorar performance
3. **API REST**: Crear API para servir los datos
4. **Validación**: Agregar validaciones de calidad de datos
5. **Alertas**: Notificaciones cuando hay datos nuevos

## 👥 Mantenimiento

Para actualizar los datos:

```bash
# Ejecutar procesamiento completo
python hana.py

# Verificar archivo generado
ls -la prepared_data.json

# Probar consumo
python ejemplo_consumo.py
```

---

**Proyecto completado exitosamente** ✅

Los datos de HANA Cloud están ahora preparados y mapeados, listos para ser consumidos directamente por cualquier aplicación.
