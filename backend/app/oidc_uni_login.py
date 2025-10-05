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
    client_kwargs={"scope": "openid email profile"}
)

@router.get("/login")
async def login(request: Request):
    return await oauth.university.authorize_redirect(request, OIDC_REDIRECT_URI)

@router.get("/auth/callback")
async def auth_callback(request: Request):
    try:
        token = await oauth.university.authorize_access_token(request)
        userinfo = await oauth.university.parse_id_token(request, token)
        #return {"user": userinfo}
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(url=f"{frontend_url}?authenticated=true")
    
    except Exception as e:
        print(f"OIDC callback error: {e}")
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(url=f"{frontend_url}?error=oidc_failed")
