# doubleAgent

[![CI](https://github.com/doubleAgent-ohtu/doubleAgent/actions/workflows/CI.yml/badge.svg?branch=main)](https://github.com/doubleAgent-ohtu/doubleAgent/actions/workflows/CI.yml)

# DoubleAgent Monorepo

This repository contains a **FastAPI backend** and a **React + Vite frontend** in a monorepo setup.

- **Backend:** `backend/app/main.py` (FastAPI)
- **Frontend:** `frontend/src/App.jsx` (React + Vite)

This README explains how to run the project manually during development and also how to test using Docker Compose.

---

## 1. Manual Development Setup

You can run the backend and frontend dev servers manually for faster development and hot reload.

### Prerequisites

- Python 3.11+ and Poetry installed
- Node.js 20+ and npm installed

---

### 1.1 Backend

1. Enter the backend folder:

```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

### 1.2 Frontend

1. Enter the frontend folder

```bash
cd frontend
npm install
npm run dev
```

### 1.3 Connecting

To reach the frontend go to URL <localhost:3000>

To reach the backend go to URL <localhost:8000>

## 2. Docker compose

Docker Compose can be used to start both services together in containers

### 2.1 Prerequisites

- Docker and Docker compose installed

### 2.2 Start services

From the project root:

```bash
docker-compose up --build
```

> **Note:** This setup is for **testing**, not production.
> The backend runs Uvicorn without multiple workers or hot reload.
> The frontend may be served as a static build via Nginx.

## 3. Notes

> **Tip:** For active development, it’s recommended to run the backend and frontend manually with hot reload.
>
> Docker Compose is mainly useful for integration testing or quickly spinning up a fully containerized environment.

> **Future improvements:**
>
> - Separate Docker Compose setups for **development** and **production**.
> - Backend production setup with **Gunicorn + Uvicorn workers**.
> - Frontend environment variables pointing to production backend.
