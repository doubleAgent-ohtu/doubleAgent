from fastapi import APIRouter, Request
from authlib.integrations.starlette_client import OAuth
from fastapi.responses import RedirectResponse
import os

oidc_router = APIRouter()

DA_OIDC_BASE_URL = os.getenv("DA_OIDC_BASE_URL")
DA_OIDC_CLIENT_ID = os.getenv("DA_OIDC_CLIENT_ID")
DA_OIDC_CLIENT_SECRET = os.getenv("DA_OIDC_CLIENT_SECRET")
DA_OIDC_REDIRECT_URI = os.getenv("DA_OIDC_REDIRECT_URI")
DA_ALLOWED_GROUP = os.getenv("DA_ALLOWED_GROUP", "grp-doubleagent")
# Parse boolean from DA_ENFORCE_GROUP_CHECK env var (temporary for testing)
isGroupCheckEnforced = os.getenv("DA_ENFORCE_GROUP_CHECK", "true").lower() == "true"

oauth = OAuth()

oauth.register(
    name="university",
    client_id=DA_OIDC_CLIENT_ID,
    client_secret=DA_OIDC_CLIENT_SECRET,
    server_metadata_url=f"{DA_OIDC_BASE_URL}/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile groups"
    },  # what we want to know about user
)


@oidc_router.get("/login")
# Handles the initial login request from the user's browser
# and redirects them to the university's login page.
async def login(request: Request):
    return await oauth.university.authorize_redirect(request, DA_OIDC_REDIRECT_URI)


@oidc_router.get("/auth/callback")
# Handles the callback from the university after the user has logged in.
async def auth_callback(request: Request):
    frontend_url = os.getenv("DA_FRONTEND_URL")
    try:
        # This is a secure, direct request from our backend to the university's backend.
        token = await oauth.university.authorize_access_token(request)

        # Extracts the user's info from the token.
        userinfo = token["userinfo"]

        # Debug: print all userinfo to see what we receive
        print(f"DEBUG - Userinfo received: {userinfo}")

        # Check if user belongs to the allowed group
        user_group = userinfo.get("hyGroupCn")

        if isGroupCheckEnforced:
            if not user_group:
                print(
                    f"Login denied: No hyGroupCn found for user {userinfo.get('sub')}"
                )
                print(f"Available userinfo keys: {list(userinfo.keys())}")
                return RedirectResponse(url=f"{frontend_url}?error=no_group")

            if user_group != DA_ALLOWED_GROUP:
                print(
                    f"Login denied: User group '{user_group}' does not match allowed group '{DA_ALLOWED_GROUP}'"
                )
                return RedirectResponse(url=f"{frontend_url}?error=unauthorized_group")

            print(
                f"User logged in successfully: {userinfo.get('displayName')} ({user_group})"
            )
        else:
            print(
                f"⚠️ GROUP CHECK DISABLED - User logged in without validation: {userinfo.get('displayName')}"
            )
            if user_group:
                print(f"   User's hyGroupCn: {user_group}")
            else:
                print(f"   No hyGroupCn found in userinfo")

        # Saves the user's details into the server-side session
        request.session["user"] = userinfo

        return RedirectResponse(url=frontend_url)

    except Exception as e:
        # Catch the login errors.
        print(f"OIDC callback error: {e}")
        return RedirectResponse(url=f"{frontend_url}?error=login_failed")
