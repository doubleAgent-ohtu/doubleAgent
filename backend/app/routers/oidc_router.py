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
    client_kwargs={"scope": "openid email profile"},  # Requesting email access
)

@oidc_router.get("/login")
async def login(request: Request):
    """
    Handles the initial login request and redirects to the university's login page.
    """
    return await oauth.university.authorize_redirect(request, DA_OIDC_REDIRECT_URI)

@oidc_router.get("/auth/callback")
async def auth_callback(request: Request):
    """
    Handles the callback from the university and enforces the email whitelist check.
    """
    frontend_url = os.getenv("DA_FRONTEND_URL")
    try:
        # Securely retrieve the access token from the university
        token = await oauth.university.authorize_access_token(request)
        userinfo = token["userinfo"]

        # Extract the email address (University OIDC usually provides 'mail' or 'email')
        user_email = (userinfo.get("mail") or userinfo.get("email", "")).lower()

        # Enforce authorization if the toggle is set to true
        if isMailCheckEnforced:
            # Parse the whitelist string into a clean list of emails
            allowed_list = [e.strip().lower() for e in DA_ALLOWED_USERS.split(",") if e]
            
            if user_email not in allowed_list:
                print(f"Unauthorized access attempt by: {user_email}")
                # Redirect to an unauthorized page on your frontend
                return RedirectResponse(url=f"{frontend_url}/unauthorized")

        # Save the user's details into the server-side session
        request.session["user"] = userinfo

        return RedirectResponse(url=frontend_url)

    except Exception as e:
        print(f"OIDC callback error: {e}")
        return RedirectResponse(url=f"{frontend_url}/error")