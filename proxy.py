"""
Proxy Server para Casa Bonita Residencial
Maneja la autenticación con LogicWare API y proxy de requests para evitar CORS
"""

import os
import httpx
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración
PORT = int(os.getenv('PORT', 3002))
X_API_KEY = os.getenv('X_API_KEY')
X_SUBDOMAIN = os.getenv('X_SUBDOMAIN')
NODE_ENV = os.getenv('NODE_ENV', 'development')

# Mantra API
MANTRA_GROUP_ID = os.getenv('MANTRA_GROUP_ID')
MANTRA_API_KEY = os.getenv('MANTRA_API_KEY')
MANTRA_TAG_ID = os.getenv('MANTRA_TAG_ID', 'TAG_NO_CALIFICADO')

# Validar variables críticas
if not X_API_KEY or not X_SUBDOMAIN:
    print('❌ ERROR: Variables de entorno faltantes')
    print('Configura X_API_KEY y X_SUBDOMAIN en tu archivo .env')
    if NODE_ENV == 'production':
        exit(1)

# Crear aplicación FastAPI
app = FastAPI(
    title="Casa Bonita Proxy API",
    description="API Proxy para LogicWare - Casa Bonita Residencial",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache para el token
token_cache: Dict[str, Any] = {
    'token': None,
    'expires_at': None
}


# ==================== MODELOS PYDANTIC ====================

class LeadCreate(BaseModel):
    """Modelo para crear un nuevo lead"""
    # Campos requeridos
    portalCode: str = Field(..., description="Código del portal")
    projectCode: str = Field(..., description="Código del proyecto")
    documentType: int = Field(..., description="Tipo de documento")
    firstName: str = Field(..., description="Nombres")
    
    # Campos opcionales
    paternalLastname: Optional[str] = None
    maternalLastname: Optional[str] = None
    email: Optional[str] = None
    phoneNumber: Optional[str] = None
    comment: Optional[str] = None


class MantraContact(BaseModel):
    """Modelo para enviar contacto no calificado a Mantra"""
    name: str = Field(..., description="Nombre completo del contacto")
    phone: str = Field(..., description="Número sin código de país")
    countryCode: str = Field(default="51", description="Código de país")
    email: Optional[str] = Field(None, description="Email opcional")
    custom_1: Optional[str] = Field(None, description="Información adicional o fuente")
    
    class Config:
        json_schema_extra = {
            "example": {
                "portalCode": "WEB",
                "projectCode": "CASABONITA",
                "documentType": 1,
                "firstName": "Juan",
                "paternalLastname": "Pérez",
                "maternalLastname": "García",
                "documentNumber": "12345678",
                "email": "juan@email.com",
                "phoneNumber": "+51946552086",
                "comment": "Interesado en el proyecto",
                "marketingConsent": "si",
                "udfField1": "si",
                "udfField2": "si",
                "udfField3": "no",
                "udfField4": "no",
                "udfField5": "landing_page",
                "codSeller": 0,
                "emailSeller": ""
            }
        }


# ==================== FUNCIONES DE AUTENTICACIÓN ====================

async def get_valid_token() -> str:
    """
    Obtiene un token válido de LogicWare API
    Usa caché si el token aún es válido (55 minutos)
    """
    # Verificar si hay token válido en caché
    if token_cache['token'] and token_cache['expires_at']:
        if datetime.now() < token_cache['expires_at']:
            print(f"✅ Usando token en caché (válido hasta {token_cache['expires_at'].strftime('%H:%M:%S')})")
            return token_cache['token']
    
    # Obtener nuevo token
    print('🔄 Obteniendo nuevo token de LogicWare API...')
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                'https://gw.logicwareperu.com/auth/external/token',
                headers={
                    'X-API-Key': X_API_KEY,
                    'X-Subdomain': X_SUBDOMAIN,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            )
            
            response.raise_for_status()
            data = response.json()
            
            if data.get('succeeded') and data.get('data', {}).get('accessToken'):
                token_cache['token'] = data['data']['accessToken']
                token_cache['expires_at'] = datetime.now() + timedelta(minutes=55)
                print(f"✅ Token obtenido exitosamente (válido por 55 minutos)")
                return token_cache['token']
            else:
                raise ValueError('Token response invalid - no accessToken found')
                
    except httpx.HTTPError as e:
        print(f'❌ Error HTTP obteniendo token: {e}')
        raise HTTPException(status_code=500, detail=f"Failed to obtain access token: {str(e)}")
    except Exception as e:
        print(f'❌ Error inesperado obteniendo token: {e}')
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Casa Bonita Proxy API",
        "version": "1.0.0",
        "api_key_configured": bool(X_API_KEY),
        "subdomain_configured": bool(X_SUBDOMAIN)
    }


@app.get("/health")
async def health_check():
    """Endpoint de health check detallado"""
    token_status = "valid" if (token_cache['token'] and token_cache['expires_at'] and datetime.now() < token_cache['expires_at']) else "expired"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "config": {
            "api_key_configured": bool(X_API_KEY),
            "subdomain_configured": bool(X_SUBDOMAIN),
            "subdomain": X_SUBDOMAIN if X_SUBDOMAIN else None
        },
        "token_cache": {
            "status": token_status,
            "expires_at": token_cache['expires_at'].isoformat() if token_cache['expires_at'] else None
        }
    }


@app.get("/auth/external/token")
@app.post("/auth/external/token")
async def get_token():
    """Endpoint para obtener el token de acceso directamente"""
    try:
        token = await get_valid_token()
        return {
            "succeeded": True,
            "data": {
                "accessToken": token
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f'❌ Error en /auth/external/token: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/units/stock")
async def get_units_stock(projectCode: str = "CASABONITA"):
    """
    Obtiene el stock de unidades disponibles en un proyecto
    
    Args:
        projectCode: Código del proyecto (default: CASABONITA)
    """
    try:
        token = await get_valid_token()
        api_url = f'https://gw.logicwareperu.com/external/units/stock?projectCode={projectCode}'
        
        print(f'📡 Proxying GET request to: {api_url}')
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                api_url,
                headers={
                    'Authorization': f'Bearer {token}',
                    'X-Subdomain': X_SUBDOMAIN,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'Casa-Bonita-Proxy/1.0'
                }
            )
            
            print(f'📊 API response status: {response.status_code}')
            
            if response.status_code == 404:
                print('❌ Error 404 - Endpoint no encontrado')
                print(f'📍 URL llamada: {api_url}')
            
            if response.status_code >= 400:
                print(f'❌ Error response: {response.text[:200]}')
            
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
            
    except httpx.HTTPError as e:
        print(f'❌ HTTP Error: {e}')
        raise HTTPException(status_code=500, detail=f"Failed to connect to API: {str(e)}")
    except Exception as e:
        print(f'❌ Unexpected error: {e}')
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/leads/create")
async def create_lead(lead: LeadCreate):
    """
    Crea un nuevo lead en LogicWare API
    
    Args:
        lead: Datos del lead a crear (validados automáticamente por Pydantic)
    
    Returns:
        Respuesta de LogicWare API con el lead creado
    """
    try:
        token = await get_valid_token()
        api_url = 'https://gw.logicwareperu.com/external/leads/create'
        
        print(f'📝 Creating lead at: {api_url}')
        
        # Convertir a dict y ELIMINAR campos vacíos o con valores por defecto
        lead_dict = lead.model_dump(exclude_none=True)
        
        # Remover campos vacíos (strings vacíos, 0, etc.)
        cleaned_lead_data = {
            k: v for k, v in lead_dict.items() 
            if v not in ['', 0, None, [], {}]
        }
        
        print(f'📋 Lead data: {cleaned_lead_data}')
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                api_url,
                headers={
                    'Authorization': f'Bearer {token}',
                    'X-Subdomain': X_SUBDOMAIN,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'Casa-Bonita-Proxy/1.0'
                },
                json=cleaned_lead_data
            )
            
            print(f'📊 Lead API response status: {response.status_code}')
            
            if response.status_code in [200, 201]:
                print('✅ Lead created successfully')
                result = response.json()
                if result.get('data'):
                    print(f"   Lead ID: {result['data'].get('leadId')}")
                    print(f"   Assigned to: {result['data'].get('assignedTo')}")
            else:
                print('❌ Lead creation failed')
                print(f'   Response: {response.text[:300]}')
            
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
            
    except httpx.HTTPError as e:
        print(f'❌ HTTP Error creating lead: {e}')
        raise HTTPException(status_code=500, detail=f"Failed to create lead: {str(e)}")
    except Exception as e:
        print(f'❌ Unexpected error creating lead: {e}')
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/mantra/contact")
async def send_to_mantra(contact: MantraContact):
    """
    Envía un contacto no calificado a Mantra
    
    Args:
        contact: Datos del contacto a enviar
    
    Returns:
        Respuesta de Mantra API
    """
    try:
        mantra_url = 'https://wbpback.mantra.chat/contacts/new'
        
        print(f'📤 Sending non-qualified contact to Mantra')
        
        # Construir payload para Mantra
        mantra_payload = {
            "groupId": MANTRA_GROUP_ID,
            "apiKey": MANTRA_API_KEY,
            "data": {
                "name": contact.name,
                "phone": contact.phone,
                "countryCode": contact.countryCode,
                "tagIds": [MANTRA_TAG_ID]
            }
        }
        
        # Agregar campos opcionales
        if contact.email:
            mantra_payload["data"]["email"] = contact.email
        if contact.custom_1:
            mantra_payload["data"]["custom_1"] = contact.custom_1
        
        print(f'📋 Mantra payload: {mantra_payload}')
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                mantra_url,
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                json=mantra_payload
            )
            
            print(f'📊 Mantra API response status: {response.status_code}')
            
            if response.status_code in [200, 201]:
                result = response.json()
                print(f'✅ Contact sent to Mantra: {result.get("resultOp", "unknown")}')
            else:
                print(f'❌ Mantra request failed')
                print(f'   Response: {response.text[:300]}')
            
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
            
    except httpx.HTTPError as e:
        print(f'❌ HTTP Error sending to Mantra: {e}')
        raise HTTPException(status_code=500, detail=f"Failed to send to Mantra: {str(e)}")
    except Exception as e:
        print(f'❌ Unexpected error sending to Mantra: {e}')
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ==================== MANEJO DE ERRORES ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Manejo global de excepciones HTTP"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "succeeded": False,
            "error": exc.detail,
            "statusCode": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Manejo global de excepciones generales"""
    print(f'❌ Unhandled exception: {exc}')
    return JSONResponse(
        status_code=500,
        content={
            "succeeded": False,
            "error": "Internal server error",
            "details": str(exc),
            "statusCode": 500
        }
    )


# ==================== STARTUP ====================

@app.on_event("startup")
async def startup_event():
    """Evento ejecutado al iniciar el servidor"""
    print('\n' + '='*60)
    print('🚀 Casa Bonita Proxy API - FastAPI')
    print('='*60)
    print(f'📡 Port: {PORT}')
    print(f'🔐 API Key configurada: {"✅" if X_API_KEY else "❌"}')
    print(f'🏢 Subdominio configurado: {"✅ " + X_SUBDOMAIN if X_SUBDOMAIN else "❌"}')
    print(f'🌍 Environment: {NODE_ENV}')
    print('\n📍 Endpoints disponibles:')
    print(f'   - Health: http://localhost:{PORT}/health')
    print(f'   - Docs: http://localhost:{PORT}/docs')
    print(f'   - Token: http://localhost:{PORT}/auth/external/token')
    print(f'   - Stock: http://localhost:{PORT}/api/units/stock?projectCode=CASABONITA')
    print(f'   - Leads (CRM): http://localhost:{PORT}/api/leads/create')
    print(f'   - Mantra (No calificados): http://localhost:{PORT}/api/mantra/contact')
    print(f'\n🔗 Mantra configurado: {"✅" if MANTRA_GROUP_ID and MANTRA_API_KEY else "❌"}')
    print('\n✨ Server ready!')
    print('='*60 + '\n')


@app.on_event("shutdown")
async def shutdown_event():
    """Evento ejecutado al apagar el servidor"""
    print('\n👋 Shutting down Casa Bonita Proxy API...')
    print('✅ Server closed gracefully\n')


# ==================== EJECUCIÓN ====================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "proxy:app",
        host="0.0.0.0",
        port=PORT,
        reload=(NODE_ENV == 'development'),
        log_level="info"
    )