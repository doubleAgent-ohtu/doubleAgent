# -----------------------------
# Build stage
# -----------------------------
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build tools and libraries
RUN apt-get update \
 && apt-get install -y build-essential libpq-dev \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir "poetry==1.8.3"

# Install globally (no venv)
ENV POETRY_VIRTUALENVS_CREATE=false

# Copy dependency files
COPY backend/pyproject.toml backend/poetry.lock ./

# Install production dependencies
RUN poetry install --only main --no-interaction --no-ansi

# Copy application code
COPY backend/app ./app

# -----------------------------
# Final production image
# -----------------------------
FROM python:3.11-slim

WORKDIR /app

# Install runtime libraries
RUN apt-get update \
 && apt-get install -y libpq-dev \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Copy dependencies from builder
COPY --from=builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code from builder
COPY --from=builder /app/app ./app

# Install Gunicorn + Uvicorn
RUN pip install --no-cache-dir gunicorn uvicorn

# Expose FastAPI port
EXPOSE 8000

# Start FastAPI with Gunicorn + Uvicorn
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000"]
