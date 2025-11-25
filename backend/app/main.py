import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from starlette.middleware.sessions import SessionMiddleware
from app.chatbot import ChatbotService
from app.oidc_uni_login import router as oidc_router
from app.db.database import DBSession
from sqlalchemy.orm import Session
from app import schemas
from app.db.models import Prompt
from sqlalchemy import select, desc, or_, func
import asyncio
from fastapi.responses import StreamingResponse
import json

load_dotenv()

app = FastAPI()

app.add_middleware(SessionMiddleware, secret_key=os.getenv("DA_SESSION_SECRET"))


def get_current_user(request: Request) -> dict:
    user = request.session.get("user")
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    return user


def get_user_id(user: dict = Depends(get_current_user)) -> str:
    try:
        return user["sub"]
    except KeyError as exc:
        print("CRITICAL: 'sub' not found in user session data")
        raise HTTPException(
            status_code=404, detail="Unable to identify the user"
        ) from exc


env = os.getenv("DA_ENVIRONMENT", "not_set")
if env == "development":
    # --- DEVELOPMENT ENVIRONMENT SETUP ---
    print("✅ Running in DEVELOPMENT mode. MOCK login routes enabled.")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    print("✅ CORS enabled for development")

    # Add MOCK login route
    @app.get("/login")
    async def mock_login(request: Request):
        """Sets the mock session key."""
        # Set a mock user object directly in the session
        request.session["user"] = {
            "sub": "2Q6XGZP4DNWAEYVIDZV2KLXKO3Z4QEBM",
            "username": "pate",
            "name": "Patrick Bateman",
        }
        print("Mock user logged in")
        return RedirectResponse(url="/")

else:
    # --- PRODUCTION / OTHER ENVIRONMENT SETUP ---
    if env == "production":
        print("🚀 Running in PRODUCTION mode. Using REAL OIDC authentication.")
    else:
        print(f"⚠️ Running in '{env}' mode. Using REAL OIDC authentication.")

    # 1. Include the REAL OIDC router (which has /login and /auth/callback)
    app.include_router(oidc_router)

chatbot_a = ChatbotService()
chatbot_b = ChatbotService()

# TODO!!!! local list
messages: list[str] = []


class Message(BaseModel):
    text: str


class ChatMessage(BaseModel):
    message: str
    thread_id: str = "default"
    system_prompt: str | None = None
    model: str | None = None
    chatbot: str = "a"  # "a" or "b"


class ChatResponse(BaseModel):
    user_message: str
    ai_response: str
    thread_id: str
    chatbot: str
    model_used: str | None = None


class ConversationStart(BaseModel):
    initial_message: str
    system_prompt_a: str | None = None
    system_prompt_b: str | None = None
    thread_id: str = "default"
    turns: int = 6
    model: str | None = None


class ConversationResponse(BaseModel):
    messages: list[dict]


# Logout route is not in oidc_uni_login.py because
# local testing needs it aswell and oidc_router is
# included only in production env.
@app.post("/logout")
async def real_logout(request: Request):
    """Clears the 'user' session key."""
    request.session.pop("user", None)
    return RedirectResponse(url="/")


@app.post("/chat", response_model=ChatResponse)
def chat_with_bot(
    chat_msg: ChatMessage, current_user: dict = Depends(get_current_user)
):
    if chat_msg.chatbot == "b":
        chatbot = chatbot_b
    else:
        chatbot = chatbot_a

    ai_response = chatbot.chat(
        chat_msg.message,
        chat_msg.thread_id,
        chat_msg.system_prompt,
        chat_msg.model,
    )
    return ChatResponse(
        user_message=chat_msg.message,
        ai_response=ai_response,
        thread_id=chat_msg.thread_id,
        chatbot=chat_msg.chatbot,
    )


async def conversation_generator(conv: ConversationStart, request: Request):
    print(f"\n--- 🚀 STARTING TOKEN STREAM for {conv.turns} turns ---")
    current_message = conv.initial_message
    current_bot = "a"

    # Set system prompts if provided
    if conv.system_prompt_a:
        chatbot_a.set_system_prompt(conv.system_prompt_a)
    if conv.system_prompt_b:
        chatbot_b.set_system_prompt(conv.system_prompt_b)

    try:
        for i in range(conv.turns):
            if await request.is_disconnected():
                print("--- 🛑 Client disconnected, stopping stream. ---")
                break

            print(f"--- Stream Turn {i+1} ---")

            # Select the correct chatbot
            chatbot_instance = chatbot_a if current_bot == "a" else chatbot_b

            # 1. YIELD a "start" message
            # This tells the frontend to create a new, empty bubble
            start_data = {"type": "start", "chatbot": current_bot}
            yield f"data: {json.dumps(start_data)}\n\n"

            full_response_for_next_turn = ""

            # 2. YIELD the "token" stream
            async for token in chatbot_instance.stream_chat(
                current_message,
                conv.thread_id,
                model=conv.model,  # Pass model if you have it
            ):
                token_data = {"type": "token", "content": token}
                yield f"data: {json.dumps(token_data)}\n\n"

                # We must build up the full response to feed to the next bot
                full_response_for_next_turn += token

            # 3. YIELD an "end" message
            # This tells the frontend this message is complete
            end_data = {"type": "end"}
            yield f"data: {json.dumps(end_data)}\n\n"

            # Prepare for the next turn
            current_message = full_response_for_next_turn
            current_bot = "b" if current_bot == "a" else "a"

            await asyncio.sleep(0.01)  # Small sleep

    except Exception as e:
        print(f"--- ❌ ERROR IN STREAM ---: {e}")
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
    finally:
        print("--- 🏁 TOKEN STREAM FINISHED ---")


@app.post("/conversation")
async def start_conversation(
    conv: ConversationStart,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    if conv.turns < 1 or conv.turns > 10:
        raise HTTPException(status_code=400, detail="Turns must be between 1 and 10")
    return StreamingResponse(
        conversation_generator(conv, request), media_type="text/event-stream"
    )


@app.get("/messages")
def get_messages(current_user: dict = Depends(get_current_user)):
    return {"messages": messages}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/me")
def get_current_user_from_session(current_user: dict = Depends(get_current_user)):
    return current_user


@app.get("/")
def read_root():
    return {"message": "Chatbot API is running"}


def get_db():
    db = DBSession()
    try:
        yield db
    finally:
        db.close()


@app.post("/save_prompt", response_model=schemas.Prompt)
async def save_prompt(
    data: schemas.SavePrompt,
    user: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    if data.agent_name.strip() == "":
        data.agent_name = None
    prompt = Prompt(**data.model_dump(), user=user)
    db.add(prompt)
    db.commit()
    db.refresh(prompt)

    return prompt

"""
@app.get("/get_all_saved_prompts")
async def get_all_saved_prompts():
    text = "Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquid ex ea commodi consequat. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non provident, sunt in culpa qui official deserunt mollit anim id est laborum."
    return [{"prompt": f"{text}{i}", "agent_name": f"agent_name{i}", "id": i} for i in range(500)]
"""

@app.get("/get_all_saved_prompts", response_model=list[schemas.Prompt])
async def get_all_saved_prompts(
    user: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    prompts = db.scalars(
        select(Prompt)
        .where(Prompt.user == user)
        .order_by(Prompt.created_at)
    ).all()
    
    return prompts


@app.get("/get_saved_prompts/", response_model=list[schemas.Prompt])
async def get_user_prompts(
    user: str = Depends(get_user_id),
    db: Session = Depends(get_db),
    query: str = "",
    offset: int = 0,
    limit: int = 50,
):
    prompts = db.scalars(
        select(Prompt)
        .where(
            Prompt.user == user, or_(
                Prompt.agent_name.icontains(query), Prompt.prompt.icontains(query)
            )
        )
        .order_by(desc(Prompt.created_at))
        .limit(limit)
        .offset(offset)
    ).all()
    
    return prompts