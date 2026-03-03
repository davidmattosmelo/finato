"""
Rotas de autenticação (login, register, password recovery)
"""
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import User
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    get_current_active_user
)

router = APIRouter(tags=["Autenticação"])

# =====================================================
# SCHEMAS
# =====================================================

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str

class UserResponse(BaseModel):
    username: str
    full_name: str
    is_active: bool
    is_admin: bool

class Token(BaseModel):
    access_token: str
    token_type: str

class ForgotPasswordRequest(BaseModel):
    username: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# =====================================================
# ROTAS
# =====================================================

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Registrar novo usuário"""
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Usuário já existe")
    
    is_first = db.query(User).count() == 0
    hashed_password = get_password_hash(user.password)
    
    new_user = User(
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password,
        is_active=is_first,
        is_admin=is_first,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login e obtenção de token"""
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuário pendente de aprovação ou bloqueado")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Obter informações do usuário logado"""
    return current_user

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Gera token de recuperação de senha"""
    user = db.query(User).filter(User.username == req.username).first()
    
    # Prática de Segurança: Sempre retornamos sucesso para evitar enumeração de usuários
    if user:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expire = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        
        # Em produção, aqui entraria o envio de e-mail (SendGrid, AWS SES, etc)
        print(f"\n{'='*50}")
        print(f"📧 [SIMULAÇÃO DE E-MAIL] Recuperação de Senha")
        print(f"Usuário: {user.username}")
        print(f"Token de Recuperação: {token}")
        print(f"{'='*50}\n")

    return {"message": "Se o usuário existir, as instruções de recuperação foram geradas."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Redefine a senha usando o token"""
    user = db.query(User).filter(
        User.reset_token == req.token,
        User.reset_token_expire > datetime.utcnow()
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")

    user.hashed_password = get_password_hash(req.new_password)
    user.reset_token = None
    user.reset_token_expire = None
    db.commit()

    return {"message": "Senha redefinida com sucesso"}