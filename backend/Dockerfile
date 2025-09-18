FROM python:3.11-slim

RUN apt-get update && apt-get upgrade -y && apt-get clean

WORKDIR /app

RUN pip install --no-cache-dir poetry

COPY pyproject.toml poetry.lock ./
RUN poetry install --no-root

COPY app ./app

# Expose port
EXPOSE 8000

# Start FastAPI
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
