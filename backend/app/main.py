from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.chatbot import ChatbotService

app = FastAPI()

# CORS eston poisto
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the chatbot
chatbot = ChatbotService()

messages: list[str] = []


class Message(BaseModel):
    text: str


class ChatMessage(BaseModel):
    message: str
    thread_id: str = "default"


class ChatResponse(BaseModel):
    user_message: str
    ai_response: str
    thread_id: str


# Disable black since we need these back up after login is implemented
# fmt: off

# @app.post("/add")
# def add_message(msg: Message):
#     messages.append(msg.text)
#     return {"messages": messages}


# @app.get("/messages")
# def get_messages():
#     return {"messages": messages}


# # New chatbot endpoints
# @app.post("/chat", response_model=ChatResponse)
# def chat_with_bot(chat_msg: ChatMessage):
#     """
#     Chat with the AI assistant
#     """
#     ai_response = chatbot.chat(chat_msg.message, chat_msg.thread_id)

#     return ChatResponse(
#         user_message=chat_msg.message,
#         ai_response=ai_response,
#         thread_id=chat_msg.thread_id,
#     )


# @app.get("/")
# def read_root():
#     return {"message": "Chatbot API is running"}

# fmt: on


@app.get("/health")
def health_check():
    return {"status": "healthy"}
