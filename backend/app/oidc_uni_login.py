from fastapi import APIRouter, Request
from authlib.integrations.starlette_client import OAuth
from fastapi.responses import RedirectResponse
import os

router = APIRouter()

# configurations from .env
DA_OIDC_BASE_URL = os.getenv("DA_OIDC_BASE_URL")
DA_OIDC_CLIENT_ID = os.getenv("DA_OIDC_CLIENT_ID")
DA_OIDC_CLIENT_SECRET = os.getenv("DA_OIDC_CLIENT_SECRET")
DA_OIDC_REDIRECT_URI = os.getenv("DA_OIDC_REDIRECT_URI")

oauth = OAuth()

# Our app configurations
oauth.register(
    name="university",
    client_id=DA_OIDC_CLIENT_ID,
    client_secret=DA_OIDC_CLIENT_SECRET,
    server_metadata_url=f"{DA_OIDC_BASE_URL}/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},  # what we want to know about user
)


@router.get("/login")
# Handles the initial login request from the user's browser
# and redirects them to the university's login page.
async def login(request: Request):
    print("Login Session before redirect:", request.session)
    return await oauth.university.authorize_redirect(request, DA_OIDC_REDIRECT_URI)


@router.get("/auth/callback")
# Handles the callback from the university after the user has logged in.
async def auth_callback(request: Request):
    print("Login Session at callback:", request.session)
    try:
        # This is a secure, direct request from our backend to the university's backend.
        token = await oauth.university.authorize_access_token(request)

        # Extracts the user's info from the token.
        userinfo = token["userinfo"]

        # Saves the user's details into the server-side session
        request.session["user"] = userinfo

        # Redirects the user's browser back to the main frontend application.
        frontend_url = os.getenv("DA_LOCAL_FRONTEND_URL", "http://localhost:5173")
        # TODO security issue!
        return RedirectResponse(url=f"{frontend_url}?authenticated=true")

    except Exception as e:
        # Catch the login errors.
        print(f"OIDC callback error: {e}")
        frontend_url = os.getenv("DA_LOCAL_FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(url=f"{frontend_url}?error=oidc_failed")
