import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.middleware.sessions import SessionMiddleware
from app.chatbot import ChatbotService
from app.oidc_uni_login import router as oidc_router

# Ladataan ympäristömuuttujat .env-tiedostosta
load_dotenv()

app = FastAPI()

# Lisätään SessionMiddleware, joka on tärkeä kirjautumisen tilan hallintaan
app.add_middleware(SessionMiddleware, secret_key=os.getenv("DA_SESSION_SECRET"))

# --- MUUTOS 1: LISÄTTY "/api" PREFIX ---
# Tämä korjaa "404 Not Found" -virheen. Nyt /login-reitti löytyy osoitteesta /api/login.
app.include_router(oidc_router, prefix="/api")

# CORS-asetukset
env = os.getenv("DA_ENVIRONMENT", "development") # Oletusarvona 'development' jos ei asetettu

if env == "development":
    # Kehitystilassa sallitaan kaikki yhteydet testaamisen helpottamiseksi
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    print("✅ CORS enabled for local development")
elif env == "production":
    # --- MUUTOS 2: KORJATTU TUOTANNON CORS-ASETUKSET ---
    # Tuotannossa salli yhteydet VAIN oikeasta frontend-osoitteesta.
    # Muista asettaa DA_FRONTEND_URL -ympäristömuuttuja OpenShiftissä!
    frontend_url = os.getenv("DA_FRONTEND_URL")
    if frontend_url:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[frontend_url], # Sallitaan vain oma frontend
            allow_credentials=True,
            allow_methods=["GET", "POST"], # Sallitaan vain tarvittavat metodit
            allow_headers=["*"],
        )
        print(f"🚀 Production mode: CORS enabled for origin: {frontend_url}")
    else:
        print("⚠️ WARNING: DA_FRONTEND_URL not set in production. Frontend may not work.")

# Chatbot-palveluiden alustus
chatbot_a = ChatbotService(
    system_prompt="You are a helpful assistant. Answer questions clearly."
)
chatbot_b = ChatbotService(
    system_prompt="You are a helpful assistant. Answer questions clearly."
)

# --- MUUTOS 3: POISTETTU GLOBAALI VIESTILISTA ---
# Tämä oli kriittinen virhe. Kaikki käyttäjät jakoivat saman viestilistan.
# Keskusteluhistoria tulee hallita frontendissä.

# Pydantic-mallit viesteille
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

# API-endpointit
@app.post("/api/chat", response_model=ChatResponse)
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

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/")
def read_root():
    return {"message": "Chatbot API is running"}