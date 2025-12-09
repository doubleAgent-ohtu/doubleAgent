import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from starlette.middleware.sessions import SessionMiddleware
from app.chatbot import ChatbotService
from app.routers.oidc_router import oidc_router
from app.db.database import DBSession
from sqlalchemy.orm import Session
from app import schemas
from app.db.models import Prompt
from sqlalchemy import select, update
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
    print("✅ Running in DEVELOPMENT mode. MOCK login routes enabled.")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    print("✅ CORS enabled for development")

    @app.get("/login")
    async def mock_login(request: Request):
        """Sets the mock session key."""
        request.session["user"] = {
            "sub": "2Q6XGZP4DNWAEYVIDZV2KLXKO3Z4QEBM",
            "username": "pate",
            "name": "Patrick Bateman",
        }
        print("Mock user logged in")
        return RedirectResponse(url="/")

else:
    if env == "production":
        print("🚀 Running in PRODUCTION mode. Using REAL OIDC authentication.")
    else:
        print(f"⚠️ Running in '{env}' mode. Using REAL OIDC authentication.")

    app.include_router(oidc_router)

chatbot_a = ChatbotService()
chatbot_b = ChatbotService()

messages: list[str] = []


class Message(BaseModel):
    text: str


class ChatMessage(BaseModel):
    message: str
    thread_id: str = "default"
    system_prompt: str | None = None
    model: str | None = None
    chatbot: str = "a"


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
    print(f"--- 📝 Thread ID: {conv.thread_id} ---")
    current_message = conv.initial_message
    current_bot = "a"

    # Reset to default if empty, otherwise set custom prompt
    if conv.system_prompt_a:
        chatbot_a.set_system_prompt(conv.system_prompt_a)
    else:
        chatbot_a.set_system_prompt(chatbot_a.default_system_prompt)

    if conv.system_prompt_b:
        chatbot_b.set_system_prompt(conv.system_prompt_b)
    else:
        chatbot_b.set_system_prompt(chatbot_b.default_system_prompt)

    try:
        for i in range(conv.turns):
            if await request.is_disconnected():
                print("--- 🛑 Client disconnected, stopping stream. ---")
                break

            print(f"--- Stream Turn {i+1} ---")

            chatbot_instance = chatbot_a if current_bot == "a" else chatbot_b

            start_data = {"type": "start", "chatbot": current_bot}
            yield f"data: {json.dumps(start_data)}\n\n"

            full_response_for_next_turn = ""

            async for token in chatbot_instance.stream_chat(
                current_message,
                conv.thread_id,
                model=conv.model,
            ):
                token_data = {"type": "token", "content": token}
                yield f"data: {json.dumps(token_data)}\n\n"

                full_response_for_next_turn += token

            end_data = {"type": "end"}
            yield f"data: {json.dumps(end_data)}\n\n"

            current_message = full_response_for_next_turn
            current_bot = "b" if current_bot == "a" else "a"

            await asyncio.sleep(0.01)

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


@app.get("/get_prompts", response_model=list[schemas.Prompt])
async def get_prompts(
    user: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    prompts = db.scalars(select(Prompt).where(Prompt.user == user)).all()

    return prompts


@app.post("/save_prompt", response_model=schemas.Prompt)
async def save_prompt(
    data: schemas.SavePrompt,
    user: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    agent_name_exists = db.scalars(
        select(Prompt).where(Prompt.user == user, Prompt.agent_name == data.agent_name)
    ).first()

    if agent_name_exists:
        raise HTTPException(
            status_code=409,
            detail=f"Another prompt already saved as '{data.agent_name}'",
        )

    prompt = Prompt(**data.model_dump(), user=user)
    db.add(prompt)
    db.commit()
    db.refresh(prompt)

    return prompt


@app.put("/update_prompt/{prompt_id}", response_model=schemas.Prompt)
async def update_prompt(
    prompt_id: int,
    data: schemas.SavePrompt,
    user: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    agent_name_exists = db.scalars(
        select(Prompt).where(
            Prompt.user == user,
            Prompt.agent_name == data.agent_name,
            Prompt.id != prompt_id,
        )
    ).first()

    if agent_name_exists:
        raise HTTPException(
            status_code=409,
            detail=f"Another prompt already saved as '{data.agent_name}'",
        )

    updated_prompt = db.scalars(
        update(Prompt)
        .where(Prompt.user == user, Prompt.id == prompt_id)
        .values(**data.model_dump())
        .returning(Prompt)
    ).first()

    if not updated_prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found"
        )
    db.commit()

    return updated_prompt


@app.delete("/delete_prompt/{prompt_id}")
async def delete_prompt(
    prompt_id: int,
    user: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    prompt = db.scalars(
        select(Prompt).where(Prompt.user == user, Prompt.id == prompt_id)
    ).first()

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found"
        )

    db.delete(prompt)
    db.commit()

    return {"message": "Prompt deleted successfully"}
