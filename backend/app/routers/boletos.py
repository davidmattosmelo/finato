"""
Rotas de integração com Banco Inter (Boletos)
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import User
from app.core.security import get_current_active_user
from app.services.inter_service import InterService

router = APIRouter(tags=["Boletos"])


# =====================================================
# SCHEMAS
# =====================================================

class BoletoRequest(BaseModel):
    seuNumero: str
    valorNominal: float
    dataVencimento: str
    pagador: dict
    mensagem: Optional[dict] = None
    numDiasAgenda: Optional[int] = 60
    multa: Optional[dict] = None
    mora: Optional[dict] = None
    desconto: Optional[dict] = None


# =====================================================
# ROTAS
# =====================================================

@router.get("/buscar-no-inter/{cpf_cnpj}")
async def buscar_boleto(
    cpf_cnpj: str, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Buscar boletos no Banco Inter por CPF/CNPJ"""
    try:
        inter_service = InterService(db)
        return await inter_service.buscar_boletos(cpf_cnpj)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/emitir-boleto")
async def emitir_boleto(
    dados: BoletoRequest, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Emitir novo boleto no Banco Inter"""
    try:
        inter_service = InterService(db)
        return await inter_service.emitir_boleto(dados.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/pagador/{cpf_cnpj}")
async def buscar_pagador(
    cpf_cnpj: str, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Busca dados cadastrais do pagador no histórico do Inter"""
    try:
        inter_service = InterService(db)
        dados = await inter_service.buscar_dados_pagador(cpf_cnpj)
        if not dados:
            raise HTTPException(status_code=404, detail="Pagador não encontrado no histórico")
        return dados
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))