"""
Configurações da aplicação
"""
import os

# Configurações JWT
SECRET_KEY = os.getenv("SECRET_KEY", "SUA_CHAVE_SECRETA_MUITO_DIFICIL_AQUI")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Configurações Banco Inter
INTER_CLIENT_ID = os.getenv("INTER_CLIENT_ID")
INTER_CLIENT_SECRET = os.getenv("INTER_CLIENT_SECRET")
INTER_CERT_PATH = os.getenv("INTER_CERT_PATH")
INTER_KEY_PATH = os.getenv("INTER_KEY_PATH")
INTER_TOKEN_CACHE_FILE = "inter_token_cache.json"

# URLs Inter
INTER_OAUTH_URL = "https://cdpj.partners.bancointer.com.br/oauth/v2/token"
INTER_BOLETOS_URL = "https://cdpj.partners.bancointer.com.br/cobranca/v3/cobrancas"
