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
from app.db import models
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


@app.post("/save_prompt", response_model=schemas.Prompt)
def save_prompt(
    data: schemas.SavePrompt,
    user: dict = Depends(get_user_id),
    db: Session = Depends(get_db),
):

    prompt = models.Prompt(**data.model_dump(), user=user)
    db.add(prompt)
    db.commit()
    db.refresh(prompt)

    return prompt


@app.post("/conversations", response_model=schemas.ConversationSchema)
def save_conversation(
    data: schemas.SaveConversation,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """Save a conversation with all its messages"""
    conversation = models.Conversation(
        user=user_id,
        title=data.title,
        thread_id=data.thread_id,
        model=data.model,
        system_prompt_a=data.system_prompt_a,
        system_prompt_b=data.system_prompt_b,
        turns=data.turns,
    )
    db.add(conversation)
    db.flush()

    # Add messages
    for idx, msg in enumerate(data.messages):
        message = models.Message(
            conversation_id=conversation.id,
            chatbot=msg.get("chatbot", "unknown"),
            message=msg.get("message", ""),
            order=idx,
        )
        db.add(message)

    db.commit()
    db.refresh(conversation)

    return conversation


@app.get("/conversations", response_model=list[schemas.ConversationSchema])
def get_conversations(
    user_id: str = Depends(get_user_id), db: Session = Depends(get_db)
):
    """Get all conversations for the current user"""
    conversations = (
        db.query(models.Conversation)
        .filter(models.Conversation.user == user_id)
        .order_by(models.Conversation.created_at.desc())
        .all()
    )
    return conversations


@app.get("/conversations/{conversation_id}", response_model=schemas.ConversationSchema)
def get_conversation(
    conversation_id: int,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """Get a specific conversation with all messages"""
    conversation = (
        db.query(models.Conversation)
        .filter(
            models.Conversation.id == conversation_id,
            models.Conversation.user == user_id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return conversation


@app.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """Delete a conversation"""
    conversation = (
        db.query(models.Conversation)
        .filter(
            models.Conversation.id == conversation_id,
            models.Conversation.user == user_id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conversation)
    db.commit()

    return {"message": "Conversation deleted successfully"}
