FROM python:3.9-slim

WORKDIR /code

# Instala dependências
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copia todo o código da pasta app
COPY ./app /code/app

# Comando para rodar a API (agora aponta para app.main)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]