#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
python -m venv .venv || true
source .venv/bin/activate
pip install -r requirements.txt
cp -n .env.example .env || true
python seed.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
