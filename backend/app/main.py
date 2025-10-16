import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.middleware.sessions import SessionMiddleware
from app.chatbot import ChatbotService
from app.oidc_uni_login import router as oidc_router

# Load environment variables
load_dotenv()

app = FastAPI()

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("DA_SESSION_SECRET"),
    https_only=True,
    same_site="lax",
)

app.include_router(oidc_router)

# CORS eston poisto
env = os.getenv("DA_ENVIRONMENT", "not_set")
if env == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    print("✅ CORS enabled for development")
elif env == "production":
    print("🚀 Production mode: CORS disabled")
else:
    print("⚠️ DA_ENVIRONMENT not set correctly")

chatbot_a = ChatbotService(
    system_prompt="You are a helpful assistant. Answer questions clearly."
)
chatbot_b = ChatbotService(
    system_prompt="You are a helpful assistant. Answer questions clearly."
)

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


@app.post("/add")
def add_message(msg: Message):
    messages.append(msg.text)
    return {"messages": messages}


@app.get("/messages")
def get_messages():
    return {"messages": messages}


@app.post("/chat", response_model=ChatResponse)
def chat_with_bot(chat_msg: ChatMessage):
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


@app.get("/")
def read_root():
    return {"message": "Chatbot API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
