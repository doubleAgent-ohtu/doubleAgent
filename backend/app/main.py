from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# CORS eston poisto
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

messages: list[str] = []

class Message(BaseModel):
    text: str

@app.post("/add")
def add_message(msg: Message):
    messages.append(msg.text)
    return {"messages": messages}

@app.get("/messages")
def get_messages():
    return {"messages": messages}
