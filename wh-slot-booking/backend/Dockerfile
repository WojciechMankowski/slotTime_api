FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Pobierz pliki Swagger UI do katalogu static (brak zależności od CDN)
RUN mkdir -p /app/app/static/swagger-ui && \
    python -c "\
import urllib.request; \
base = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5'; \
urllib.request.urlretrieve(base+'/swagger-ui-bundle.js', '/app/app/static/swagger-ui/swagger-ui-bundle.js'); \
urllib.request.urlretrieve(base+'/swagger-ui.css', '/app/app/static/swagger-ui/swagger-ui.css'); \
print('Swagger UI downloaded') \
"

CMD ["sh", "-c", "python seed.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]