from fastapi import APIRouter, Request
from authlib.integrations.starlette_client import OAuth
from fastapi.responses import RedirectResponse
import os
import traceback

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
async def auth_callback(request: Request):
    """
    Handles the callback, exchanges code for token, verifies groups,
    and sets the session.
    """
    frontend_url = os.getenv("DA_FRONTEND_URL")
    try:
        token = await oauth.university.authorize_access_token(request)

        # 1. Try getting info from ID Token (parsed into 'userinfo' key automatically by Authlib)
        userinfo = token.get("userinfo")

        # 2. If userinfo is None OR if the specific group key is missing, fetch from UserInfo endpoint
        # This fixes the potential crash if 'userinfo' was None.
        if not userinfo or "hyGroupCn" not in userinfo:
            print(
                "DEBUG: Group info missing in ID Token, fetching from UserInfo endpoint..."
            )
            userinfo = await oauth.university.userinfo(token=token)

        # 3. Robust Group Check
        # We default to an empty list to avoid crashes if the key is totally missing
        user_groups = userinfo.get("hyGroupCn", [])

        # Normalize to list if the provider returned a single string
        if isinstance(user_groups, str):
            user_groups = [user_groups]

        if isGroupCheckEnforced:
            if not user_groups:
                print(
                    f"Login denied: No group data found for user {userinfo.get('sub', 'unknown')}"
                )
                # Log keys to help debug why the key is missing (e.g. is it 'groups' instead of 'hyGroupCn'?)
                print(f"DEBUG - Available keys in userinfo: {list(userinfo.keys())}")
                return RedirectResponse(url=f"{frontend_url}?error=no_group")

            # Check for membership in the list
            if DA_ALLOWED_GROUP not in user_groups:
                print(
                    f"Login denied: Required '{DA_ALLOWED_GROUP}' not found in user's groups: {user_groups}"
                )
                return RedirectResponse(url=f"{frontend_url}?error=unauthorized_group")

            print(
                f"User logged in successfully: {userinfo.get('email', 'User')} (Group verified)"
            )

        else:
            print("⚠️ GROUP CHECK DISABLED - allowing login without group validation")

        # 4. Save to session
        # We wrap in dict() to ensure it's a standard dictionary, not an Authlib object
        request.session["user"] = dict(userinfo)

        return RedirectResponse(url=frontend_url)

    except Exception as e:
        print(f"OIDC callback error: {e}")
        # Print full trace to console for easier debugging
        traceback.print_exc()
        return RedirectResponse(url=f"{frontend_url}?error=login_failed")
