FROM python:3.11-slim

WORKDIR /app

# 1. Zależności osobno - cache Dockera nie przebuduje tej warstwy
#    jeśli zmienisz tylko kod aplikacji
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# 2. Swagger UI - pobierz PRZED kopiowaniem kodu
#    (ta warstwa też będzie cache'owana)
RUN mkdir -p /app/app/static/swagger-ui && \
    python -c "\
import urllib.request; \
base = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5'; \
urllib.request.urlretrieve(base+'/swagger-ui-bundle.js', '/app/app/static/swagger-ui/swagger-ui-bundle.js'); \
urllib.request.urlretrieve(base+'/swagger-ui.css', '/app/app/static/swagger-ui/swagger-ui.css'); \
print('Swagger UI downloaded') \
"

# 3. Kod aplikacji kopiuj na końcu
COPY . .

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["./entrypoint.sh"]