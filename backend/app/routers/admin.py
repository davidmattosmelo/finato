"""
Rotas de administração de usuários
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import User
from app.core.security import get_current_admin_user, get_password_hash

router = APIRouter(prefix="/admin", tags=["Administração"])

# =====================================================
# SCHEMAS
# =====================================================

class UserListResponse(BaseModel):
    id: int
    username: str
    full_name: str
    is_active: bool
    is_admin: bool

    class Config:
        from_attributes = True

class UserCreateAdmin(BaseModel):
    username: str
    full_name: str
    password: str
    is_active: bool = True
    is_admin: bool = False

class UserUpdateAdmin(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    password: Optional[str] = None

# =====================================================
# ROTAS
# =====================================================

@router.get("/users", response_model=List[UserListResponse])
async def list_users(current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    return db.query(User).all()

@router.post("/users", response_model=UserListResponse)
async def create_user(
    user_data: UserCreateAdmin, 
    current_user: User = Depends(get_current_admin_user), 
    db: Session = Depends(get_db)
):
    """Criar usuário diretamente pelo painel admin"""
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Usuário já existe")
    
    new_user = User(
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        is_active=user_data.is_active,
        is_admin=user_data.is_admin,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}", response_model=UserListResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdateAdmin,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Editar usuário pelo painel admin"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.is_active is not None:
        if user.id == current_user.id and not user_data.is_active:
            raise HTTPException(status_code=400, detail="Você não pode bloquear a si mesmo")
        user.is_active = user_data.is_active
    if user_data.is_admin is not None:
        if user.id == current_user.id and not user_data.is_admin:
            raise HTTPException(status_code=400, detail="Você não pode remover seu próprio admin")
        user.is_admin = user_data.is_admin
    if user_data.password:
        user.hashed_password = get_password_hash(user_data.password)

    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    """Deletar um usuário (apenas admin)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Você não pode deletar sua própria conta")
    
    db.delete(user)
    db.commit()
    return {"message": "Usuário deletado com sucesso"}

# Mantemos as rotas antigas de approve/revoke/toggle-admin para compatibilidade, 
# mas o PUT /users/{user_id} acima já faz tudo isso de forma mais limpa.
@router.put("/users/{user_id}/approve")
async def approve_user(user_id: int, current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user.is_active = True
    db.commit()
    return {"message": "Usuário aprovado"}

@router.put("/users/{user_id}/revoke")
async def revoke_user(user_id: int, current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if user.id == current_user.id: raise HTTPException(status_code=400, detail="Não pode revogar a si mesmo")
    user.is_active = False
    db.commit()
    return {"message": "Acesso revogado"}