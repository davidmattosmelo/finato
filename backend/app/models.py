# backend/app/models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    
    # Campos para recuperação de senha
    reset_token = Column(String, nullable=True, index=True)
    reset_token_expire = Column(DateTime, nullable=True)

class TokenCache(Base):
    """Armazena o token do Banco Inter para evitar concorrência em arquivos físicos"""
    __tablename__ = "token_cache"

    id = Column(Integer, primary_key=True, index=True)
    access_token = Column(String, nullable=False)
    expira_em = Column(DateTime, nullable=False)