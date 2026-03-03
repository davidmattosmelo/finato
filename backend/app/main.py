"""
Aplicação principal FastAPI
Sistema de Boletos Banco Inter
"""
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, admin, boletos

# Criar tabelas no banco de dados
Base.metadata.create_all(bind=engine)

# Criar aplicação FastAPI
app = FastAPI(
    title="Sistema Boletos Inter V2",
    description="API para gestão de boletos do Banco Inter",
    version="2.0.0"
)

# =====================================================
# CONFIGURAÇÃO CORS
# =====================================================

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# ROTAS PRINCIPAIS
# =====================================================

@app.get("/")
async def root():
    """Rota raiz - Informações da API"""
    return {
        "message": "🚀 API Sistema de Boletos Inter",
        "version": "2.0.0",
        "status": "online",
        "docs": "/docs",
        "frontend": "http://localhost:3000",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

# =====================================================
# INCLUIR ROUTERS
# =====================================================

# Rotas de autenticação
app.include_router(auth.router)

# Rotas de administração
app.include_router(admin.router)

# Rotas de boletos
app.include_router(boletos.router)
