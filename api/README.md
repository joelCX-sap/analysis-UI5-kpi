# Organic Valley BI API

API REST basada en FastAPI que integra los módulos HANA y Chat AI para proporcionar servicios de Business Intelligence.

## 🚀 Inicio Rápido

### Prerequisitos
- Python 3.8+
- Acceso a SAP HANA Cloud
- Credenciales de GenAI Hub configuradas

### Instalación
```bash
cd api
pip install -r requirements.txt
```

### Variables de Entorno
Configurar archivo `.env` con:
```env
# HANA Database
hana_address=tu-servidor-hana.hanacloud.ondemand.com
hana_port=443
hana_user=tu_usuario
hana_password=tu_password
hana_table=PurchaseDocuments
hana_schema=COEAI

# GenAI Hub (configuración según tu setup)
```

### Iniciar API
```bash
# Opción 1: Script de inicio
python start_api.py

# Opción 2: Directo
python main.py

# Opción 3: Con uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

La API estará disponible en: `http://localhost:8000`

## 📚 Documentación

- **Swagger UI**: `http://localhost:8000/api/docs`
- **ReDoc**: `http://localhost:8000/api/redoc`

## 🛠️ Endpoints Principales

### Información y Salud
- `GET /` - Información básica de la API
- `GET /health` - Estado de servicios (API, HANA, Chat)

### Datos HANA
- `GET /api/hana/info` - Información de la tabla HANA
- `GET /api/hana/columns` - Mapeo de columnas técnicas a nombres legibles
- `GET /api/hana/data/all` - Obtener todos los datos preparados
- `POST /api/hana/data` - Obtener datos con parámetros específicos
- `POST /api/hana/save` - Guardar datos preparados en archivo JSON

### Chat AI
- `POST /api/chat/simple` - Chat simple sin contexto de datos
- `POST /api/chat/with-data` - Chat con contexto de datos HANA
- `POST /api/chat/query-purchase` - Consultar documentos de compra con AI
- `POST /api/chat/hana-live` - Consulta en tiempo real con análisis AI

### Servicios Combinados
- `POST /api/insight` - Obtener insights de datos con AI (endpoint principal)

## 📝 Ejemplos de Uso

### 1. Verificar Estado del Servicio
```bash
curl -X GET "http://localhost:8000/health"
```

Respuesta:
```json
{
  "status": "healthy",
  "services": {
    "api": "running",
    "hana": "connected",
    "chat": "available"
  },
  "timestamp": "2025-09-27T09:30:00.000000"
}
```

### 2. Chat Simple
```bash
curl -X POST "http://localhost:8000/api/chat/simple" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "¿Qué es Business Intelligence?"}'
```

### 3. Obtener Datos de HANA
```bash
curl -X GET "http://localhost:8000/api/hana/data/all"
```

### 4. Consulta con AI sobre Datos
```bash
curl -X POST "http://localhost:8000/api/chat/hana-live" \
  -H "Content-Type: application/json" \
  -d '{"query": "¿Cuántas plantas tenemos en nuestros datos de compras?"}'
```

### 5. Insight Principal (Recomendado)
```bash
curl -X POST "http://localhost:8000/api/insight" \
  -H "Content-Type: application/json" \
  -d '{"query": "Analiza el rendimiento de nuestras compras por planta"}'
```

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   FastAPI       │    │   SAP HANA     │
│   (SAP Fiori)   │◄──►│   REST API      │◄──►│   Database     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   GenAI Hub     │
                       │   (ChatGPT)     │
                       └─────────────────┘
```

### Componentes:
- **main.py**: Aplicación FastAPI principal con todos los endpoints
- **hana.py**: Módulo para conexión y extracción de datos HANA
- **chat.py**: Módulo para integración con GenAI Hub y análisis AI
- **start_api.py**: Script de inicio simplificado

## 🔧 Configuración para SAP Fiori

La API está configurada con CORS habilitado para permitir conexiones desde aplicaciones SAP Fiori:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Endpoints Recomendados para Fiori:
- **Datos**: `/api/hana/data/all`
- **Insights**: `/api/insight`
- **Chat**: `/api/chat/hana-live`

## 📊 Modelos de Datos

### HanaDataResponse
```json
{
  "data": [
    {
      "Client": "110",
      "Purchasing Document Number": "4500001887",
      "Company Code": "1710",
      "Plant": "1034",
      "Material Number": "000000000000100679"
    }
  ],
  "metadata": {
    "total_records": 28988,
    "columns_count": 24,
    "table_name": "PurchaseDocuments",
    "schema": "COEAI"
  },
  "timestamp": "2025-09-27T09:30:00.000000"
}
```

### ChatResponse
```json
{
  "response": "Análisis de los datos...",
  "timestamp": "2025-09-27T09:30:00.000000",
  "model_used": "gpt-4.1"
}
```

## 🚨 Manejo de Errores

La API incluye manejo global de errores con respuestas estructuradas:
```json
{
  "error": "Descripción del error",
  "detail": "Detalles técnicos",
  "timestamp": "2025-09-27T09:30:00.000000"
}
```

## 🔍 Logs y Monitoreo

Los logs incluyen información sobre:
- Conexiones HANA
- Consultas AI
- Errores y excepciones
- Rendimiento de endpoints

## 🏃‍♂️ Desarrollo

### Desarrollo Local
```bash
# Con auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# O usando el script
python start_api.py
```

### Testing
```bash
# Probar conexión HANA
python ../test_hana.py

# Probar integración Chat
python ../test_chat_integration.py
```

## 🚀 Despliegue

La API está lista para desplegar en:
- Cloud Foundry (SAP BTP)
- Docker containers
- Kubernetes
- Cualquier plataforma compatible con Python/FastAPI

### Variables de Entorno para Producción
```env
# Database
HANA_ADDRESS=production-server.hanacloud.ondemand.com
HANA_PORT=443
HANA_USER=prod_user
HANA_PASSWORD=secure_password

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=info

# CORS (especificar dominios específicos)
ALLOWED_ORIGINS=https://your-fiori-app.com,https://your-domain.com
```

## 📞 Soporte

Para problemas o consultas sobre la API:
1. Verificar logs del servidor
2. Probar endpoints de salud (`/health`)
3. Revisar configuración de variables de entorno
4. Verificar conectividad HANA

## 🔄 Próximas Funcionalidades

- [ ] Autenticación y autorización
- [ ] Rate limiting
- [ ] Cache de respuestas
- [ ] Métricas de uso
- [ ] Webhooks para notificaciones
- [ ] Soporte para múltiples tablas HANA
