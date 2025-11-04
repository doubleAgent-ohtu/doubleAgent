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
        return user["id"]
    except KeyError as exc:
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
            "id": "2Q6XGZP4DNWAEYVIDZV2KLXKO3Z4QEBM",
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

chatbot_a = ChatbotService(
    system_prompt="You are a helpful assistant. Answer questions clearly."
)
chatbot_b = ChatbotService(
    system_prompt="You are a helpful assistant. Answer questions clearly."
)


# TODO!!!! local list
messages: list[str] = []


class Message(BaseModel):
    text: str


class ChatMessage(BaseModel):
    message: str
    thread_id: str = "default"
    system_prompt: str | None = None
    chatbot: str = "a"  # "a" or "b"


class ChatResponse(BaseModel):
    user_message: str
    ai_response: str
    thread_id: str
    chatbot: str


class ConversationStart(BaseModel):
    initial_message: str
    system_prompt_a: str | None = None
    system_prompt_b: str | None = None
    thread_id: str = "default"
    turns: int = 6


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
        chat_msg.message, chat_msg.thread_id, chat_msg.system_prompt
    )
    return ChatResponse(
        user_message=chat_msg.message,
        ai_response=ai_response,
        thread_id=chat_msg.thread_id,
        chatbot=chat_msg.chatbot,
    )


@app.post("/conversation", response_model=ConversationResponse)
def start_conversation(
    conv: ConversationStart, current_user: dict = Depends(get_current_user)
):
    conversation_messages = []
    current_message = conv.initial_message
    current_bot = "a"

    # Set system prompts if provided
    if conv.system_prompt_a:
        chatbot_a.set_system_prompt(conv.system_prompt_a)
    if conv.system_prompt_b:
        chatbot_b.set_system_prompt(conv.system_prompt_b)

    for i in range(conv.turns):
        if current_bot == "a":
            response = chatbot_a.chat(current_message, conv.thread_id)
            conversation_messages.append({"chatbot": "a", "message": response})
            current_message = response
            current_bot = "b"
        else:
            response = chatbot_b.chat(current_message, conv.thread_id)
            conversation_messages.append({"chatbot": "b", "message": response})
            current_message = response
            current_bot = "a"

    return ConversationResponse(messages=conversation_messages)


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
    db: Session = Depends(get_db)
):
    data.user = user
    prompt = models.Prompt(**data.model_dump())
    db.add(prompt)
    db.commit()
    db.refresh(prompt)

    return prompt
