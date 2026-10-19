# ---- Build stage ----
FROM python:3.12-slim AS builder

RUN pip install pdm

WORKDIR /app

COPY pyproject.toml pdm.lock* ./

RUN pdm export --prod -o requirements.txt

# ---- Runtime stage ----
FROM python:3.12-slim

WORKDIR /app

COPY --from=builder /app/requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "main.py"]