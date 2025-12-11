# Backend Documentation

## Requirements

**Preferred:** Docker-compose Development Setup. Use the root `docker-compose.yml` to build and run the entire application (frontend + backend).

**Development Requirements:**
- Python 3.11+
- Poetry 1.8.3+ for dependency management
- PostgreSQL database
- OpenAI API access (via Azure)

## Technologies

The backend of the application is built with **FastAPI**, a modern, high-performance web framework for building APIs with Python.

**Key Technologies:**
- **FastAPI** — web framework and API server
- **SQLAlchemy** — ORM for database operations
- **Alembic** — database migration tool
- **Pydantic** — data validation and settings management
- **LangChain & LangGraph** — LLM orchestration and conversation management
- **OpenAI API** (Azure) — LLM integration
- **Authlib** — OIDC authentication
- **Uvicorn/Gunicorn** — ASGI server for production

## Structure

The application source is under `app/`:

- `app/main.py` — FastAPI application entry point, routes, and middleware
- `app/chatbot.py` — ChatbotService class for LLM conversation logic
- `app/schemas.py` — Pydantic models for validation
- `app/db/database.py` — Database configuration
- `app/db/models.py` — SQLAlchemy models (Prompt, Conversation, Message)
- `app/routers/oidc_router.py` — OIDC authentication routes
- `app/db/alembic-conf/` — Database migrations

## API Endpoints

### Authentication
- `GET /login` — Login (OIDC in production, mock in development)
- `GET /auth/callback` — OIDC callback
- `POST /logout` — Logout
- `GET /me` — Get current user info

### Chat
- `POST /chat` — Send single message to chatbot
- `POST /conversation` — Start multi-turn bot conversation (returns SSE stream)
- `GET /download-chat/{thread_id}` — Download chat as .txt

### Prompts
- `GET /get_prompts` — Get all user prompts
- `POST /save_prompt` — Save new prompt
- `PUT /update_prompt/{id}` — Update prompt
- `DELETE /delete_prompt/{id}` — Delete prompt

### Conversations
- `POST /conversations` — Save conversation with messages
- `GET /conversations` — Get all user conversations
- `GET /conversations/{id}` — Get specific conversation
- `DELETE /conversations/{id}` — Delete conversation

### Utility
- `GET /health` — Health check
- `GET /` — API status

## Core Components

### ChatbotService (`app/chatbot.py`)

Manages LLM interactions using LangChain and LangGraph.

**Features:**
- Multi-model support (gpt-4o, gpt-4o-mini, gpt-4.1, gpt-5)
- Thread-based conversation memory
- Streaming and non-streaming modes


### Database Models

**Prompt** — User-defined system prompts  
**Conversation** — Conversation metadata (1-20 turns constraint)  
**Message** — Individual messages (cascade delete)

### Authentication

**Production:** OIDC (OpenID Connect) for university authentication  
**Development:** Mock authentication with CORS enabled


## Testing

Tests use **pytest** with mocking of external dependencies.

```bash
cd backend
poetry install
poetry run pytest
```

Test files in `tests_back/`:
- `test_chatbot.py` — ChatbotService tests
- `test_conversation_history.py` — Conversation history tests


## Development

**Docker Compose (Recommended):**
```bash
docker-compose up  # From project root
```

**Local:**
```bash
cd backend
poetry install
poetry run python -m app
```

API: `http://localhost:8000`  
Docs: `http://localhost:8000/docs`

## Troubleshooting

**Database errors:** Check `DA_DB_URL`, verify database is running  
**OpenAI API errors:** Verify `DA_OPENAI_API_KEY`, check rate limits  
**OIDC errors:** Verify OIDC environment variables, check redirect URI  
**Migration conflicts:** Use `alembic history`, resolve manually if needed