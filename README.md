# doubleAgent

[![CI](https://github.com/doubleAgent-ohtu/doubleAgent/actions/workflows/CI.yml/badge.svg?branch=main)](https://github.com/doubleAgent-ohtu/doubleAgent/actions/workflows/CI.yml)
[![codecov](https://codecov.io/gh/doubleAgent-ohtu/doubleAgent/graph/badge.svg?token=9PQ7TB9IBC)](https://codecov.io/gh/doubleAgent-ohtu/doubleAgent)

Find it online: https://double-agent-ohtuprojekti-staging.ext.ocp-prod-0.k8s.it.helsinki.fi/

# DoubleAgent Monorepo

This repository contains a **FastAPI backend** and a **React + Vite frontend** in a monorepo setup.

This README explains how to run the project manually during development and also how to test using Docker Compose.

---

## 1. Docker-compose Development Setup (new & preferred)

Docker-compose makes development easier and faster.

### Prerequisites

- Docker & docker-compose installed
- `.env` file in the `backend/` folder containing your OpenAI API key

To create the `.env` file:

```bash
cd backend
touch .env
```

Add the following line to .env:

```bash
OPENAI_API_KEY=your_secret_key
```

---

### Running

In the project root simply run:

```bash
docker-compose up --build
```

**Tip:** After the first run you can leave out the "--build" flag (faster initialization)

## 2. Running tests

To check the test run commands:

Frontend:

```bash
cd frontend
npm run test
```

Backend:

```bash
cd backend
pytest
```

## 3. Notes

> Docker-compose now supports hot-reloading for both back- and frontend.

> It is still possible to run the program old fashioned way of starting backend and frontend in separate terminals, but it is no longer recommended.
