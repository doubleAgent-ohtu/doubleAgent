from fastapi import APIRouter, Request
from authlib.integrations.starlette_client import OAuth
from fastapi.responses import RedirectResponse
import os

router = APIRouter()

OIDC_BASE_URL = os.getenv("DA_OIDC_BASE_URL")
OIDC_CLIENT_ID = os.getenv("DA_OIDC_CLIENT_ID")
OIDC_CLIENT_SECRET = os.getenv("DA_OIDC_CLIENT_SECRET")
OIDC_REDIRECT_URI = os.getenv("DA_OIDC_REDIRECT_URI") 

oauth = OAuth()
oauth.register(
    name="university",
    client_id=OIDC_CLIENT_ID,
    client_secret=OIDC_CLIENT_SECRET,
    server_metadata_url=f"{OIDC_BASE_URL}/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.get("/login")
async def login(request: Request):
    print("Login Session before redirect:", request.session)
    return await oauth.university.authorize_redirect(request, OIDC_REDIRECT_URI)


@router.get("/auth/callback")
async def auth_callback(request: Request):
    print("Login Session at callback:", request.session)
    try:
        # Tämä hakee ja validoi tokenit onnistuneesti
        token = await oauth.university.authorize_access_token(request)
        
        # --- KORJAUS TÄSSÄ ---
        # Käyttäjätiedot ovat jo valmiina token-objektissa.
        # Poistetaan turha parse_id_token -kutsu.
        userinfo = token['userinfo']

        # Tallenna käyttäjätiedot sessioon myöhempää käyttöä varten
        request.session['user'] = userinfo

        # Ohjaa käyttäjä takaisin frontendiin
        frontend_url = os.getenv("DA_LOCAL_FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(url=f"{frontend_url}?authenticated=true")

    except Exception as e:
        print(f"OIDC callback error: {e}")
        frontend_url = os.getenv("DA_LOCAL_FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(url=f"{frontend_url}?error=oidc_failed")
