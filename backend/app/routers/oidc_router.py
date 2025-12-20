from fastapi import APIRouter, Request
from authlib.integrations.starlette_client import OAuth
from fastapi.responses import RedirectResponse
import os

oidc_router = APIRouter()

# OIDC Configuration
DA_OIDC_BASE_URL = os.getenv("DA_OIDC_BASE_URL")
DA_OIDC_CLIENT_ID = os.getenv("DA_OIDC_CLIENT_ID")
DA_OIDC_CLIENT_SECRET = os.getenv("DA_OIDC_CLIENT_SECRET")
DA_OIDC_REDIRECT_URI = os.getenv("DA_OIDC_REDIRECT_URI")

# Authorization Configuration
# Pull the comma-separated string from OpenShift
DA_ALLOWED_USERS = os.getenv("DA_ALLOWED_USERS", "")

isMailCheckEnforced = os.getenv("DA_ENFORCE_MAIL_CHECK", "true").lower() == "true"

oauth = OAuth()

oauth.register(
    name="university",
    client_id=DA_OIDC_CLIENT_ID,
    client_secret=DA_OIDC_CLIENT_SECRET,
    server_metadata_url=f"{DA_OIDC_BASE_URL}/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@oidc_router.get("/login")
async def login(request: Request):
    return await oauth.university.authorize_redirect(request, DA_OIDC_REDIRECT_URI)


@oidc_router.get("/auth/callback")
async def auth_callback(request: Request):
    frontend_url = os.getenv("DA_FRONTEND_URL")
    try:
        token = await oauth.university.authorize_access_token(request)
        userinfo = token["userinfo"]

        # 1. Get the email (University OIDC usually uses 'mail' or 'email')
        user_email = (userinfo.get("mail") or userinfo.get("email", "")).lower()

        # 2. Check the whitelist if enforcement is enabled
        if isMailCheckEnforced:
            allowed_list = [e.strip().lower() for e in DA_ALLOWED_USERS.split(",") if e]

            if user_email not in allowed_list:
                print(f"Unauthorized access attempt by {user_email}")
                # Redirecting back to frontend_url as requested
                return RedirectResponse(url=frontend_url)

        # 3. Success: save session and redirect
        request.session["user"] = userinfo
        return RedirectResponse(url=frontend_url)

    except Exception as e:
        print(f"OIDC callback error: {e}")
        return RedirectResponse(url=frontend_url)
