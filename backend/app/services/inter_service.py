"""
Serviço de integração com API do Banco Inter (Assíncrono)
"""
import json
from datetime import datetime, timedelta
import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import (
    INTER_CLIENT_ID,
    INTER_CLIENT_SECRET,
    INTER_CERT_PATH,
    INTER_KEY_PATH,
    INTER_OAUTH_URL,
    INTER_BOLETOS_URL
)
from app.models import TokenCache


class InterService:
    """Gerencia operações com a API do Banco Inter de forma assíncrona"""
    
    def __init__(self, db: Session):
        self.db = db
        self.client_id = INTER_CLIENT_ID
        self.client_secret = INTER_CLIENT_SECRET
        self.cert_path = INTER_CERT_PATH
        self.key_path = INTER_KEY_PATH
        # Configura os certificados para o HTTPX
        self.cert = (self.cert_path, self.key_path)
    
    async def get_token(self) -> str:
        """Obtém token de acesso do banco de dados ou renova se necessário"""
        token_record = self.db.query(TokenCache).first()
        
        if token_record:
            # Verifica se o token ainda é válido (margem de segurança de 5 minutos)
            if datetime.utcnow() < token_record.expira_em - timedelta(minutes=5):
                return token_record.access_token
                
        return await self._renovar_token(token_record)
    
    async def _renovar_token(self, token_record: TokenCache = None) -> str:
        """Renova o token de acesso via API e salva no banco"""
        try:
            print("🔄 Renovando Token Inter...")
            
            async with httpx.AsyncClient(cert=self.cert) as client:
                response = await client.post(
                    INTER_OAUTH_URL,
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "grant_type": "client_credentials",
                        "scope": "boleto-cobranca.read boleto-cobranca.write"
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                dados = response.json()
            
            novo_token = dados['access_token']
            expira_em = datetime.utcnow() + timedelta(seconds=dados['expires_in'])
            
            # Atualiza ou cria o registro no banco
            if token_record:
                token_record.access_token = novo_token
                token_record.expira_em = expira_em
            else:
                novo_registro = TokenCache(access_token=novo_token, expira_em=expira_em)
                self.db.add(novo_registro)
                
            self.db.commit()
            
            print("✅ Token renovado com sucesso")
            return novo_token
            
        except Exception as e:
            print(f"❌ Erro ao renovar token: {e}")
            raise HTTPException(
                status_code=500, 
                detail="Falha na autenticação com o Banco Inter"
            )
    
    async def buscar_boletos(self, cpf_cnpj: str) -> dict:
        """Busca boletos por CPF/CNPJ"""
        token = await self.get_token()
        headers = {"Authorization": f"Bearer {token}"}
        cpf_cnpj_limpo = cpf_cnpj.replace(".", "").replace("-", "").replace("/", "")
        
        try:
            async with httpx.AsyncClient(cert=self.cert) as client:
                response = await client.get(
                    INTER_BOLETOS_URL,
                    headers=headers,
                    params={
                        "cpfCnpj": cpf_cnpj_limpo, 
                        "filtrarDataPor": "VENCIMENTO"
                    },
                    timeout=15.0
                )
            
            if response.status_code == 200:
                boletos = response.json().get("content",[])
                
                for boleto in boletos:
                    nosso_numero = (
                        boleto.get("cobranca", {}).get("nossoNumero") or 
                        boleto.get("nossoNumero")
                    )
                    
                    if nosso_numero:
                        pdf = await self._buscar_pdf_boleto(nosso_numero, headers)
                        if pdf:
                            return {"pdf": pdf}
                
                return {"message": "Nenhum boleto encontrado"}
            
            return {"message": "Erro ao buscar boletos"}
            
        except Exception as e:
            print(f"❌ Erro ao buscar boletos: {e}")
            return {"message": "Erro ao buscar boletos"}
    
    async def buscar_dados_pagador(self, cpf_cnpj: str) -> dict:
        """Busca o histórico de boletos e extrai os dados do pagador para auto-fill"""
        token = await self.get_token()
        headers = {"Authorization": f"Bearer {token}"}
        cpf_cnpj_limpo = cpf_cnpj.replace(".", "").replace("-", "").replace("/", "")
        
        try:
            async with httpx.AsyncClient(cert=self.cert) as client:
                response = await client.get(
                    INTER_BOLETOS_URL,
                    headers=headers,
                    params={
                        "cpfCnpj": cpf_cnpj_limpo, 
                        "filtrarDataPor": "VENCIMENTO"
                    },
                    timeout=15.0
                )
            
            if response.status_code == 200:
                boletos = response.json().get("content",[])
                if boletos:
                    # Pega o pagador do boleto mais recente encontrado
                    pagador = boletos[0].get("pagador", {})
                    return pagador
            
            return {}
        except Exception as e:
            print(f"❌ Erro ao buscar dados do pagador: {e}")
            return {}

    async def _buscar_pdf_boleto(self, nosso_numero: str, headers: dict) -> str:
        """Busca PDF de um boleto específico"""
        try:
            async with httpx.AsyncClient(cert=self.cert) as client:
                response = await client.get(
                    f"{INTER_BOLETOS_URL}/{nosso_numero}",
                    headers=headers,
                    timeout=10.0
                )
            
            if response.status_code == 200:
                detail = response.json()
                return (
                    detail.get("pdf") or 
                    detail.get("boleto", {}).get("pdf") or 
                    detail.get("cobranca", {}).get("pdf")
                )
        except Exception:
            pass
        
        return None
    
    async def emitir_boleto(self, dados: dict) -> dict:
        """Emite um novo boleto"""
        token = await self.get_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        try:
            print(f"🔵 Emitindo boleto...")
            
            async with httpx.AsyncClient(cert=self.cert) as client:
                response = await client.post(
                    INTER_BOLETOS_URL,
                    headers=headers,
                    json=dados,
                    timeout=20.0
                )
            
            print(f"📥 Status Code: {response.status_code}")
            
            if response.status_code in[200, 201]:
                result = response.json()
                nosso_numero = result.get("nossoNumero")
                
                print(f"✅ Boleto emitido! Nosso número: {nosso_numero}")
                
                if nosso_numero:
                    pdf = await self._buscar_pdf_boleto(nosso_numero, headers)
                    if pdf:
                        return {
                            "pdf": pdf, 
                            "nossoNumero": nosso_numero
                        }
                
                return result
            else:
                print(f"❌ Erro na API Inter: {response.text}")
                return {"error": response.text}
                
        except Exception as e:
            print(f"❌ Erro ao emitir boleto: {e}")
            raise HTTPException(status_code=500, detail=str(e))