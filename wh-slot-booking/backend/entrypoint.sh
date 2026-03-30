#!/bin/sh
# entrypoint.sh
set -e

echo ">>> Seed / inicjalizacja bazy..."
python seed.py

echo ">>> Start aplikacji..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT