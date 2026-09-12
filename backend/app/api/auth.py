from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.database.database import get_db
from app.database.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenOut, UserOut
from app.utils.helpers import success

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def token_response(user: User) -> dict:
    token, expires_in = create_access_token(str(user.id))
    return success(TokenOut(access_token=token, expires_in=expires_in, user=UserOut.model_validate(user)).model_dump(mode="json"))


@router.post("/register", status_code=status.HTTP_201_CREATED, summary="Register a new user")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = str(payload.email).lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(name=payload.name.strip(), email=email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return token_response(user)


@router.post("/login", summary="Log in and receive a JWT access token")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    return token_response(user)


@router.get("/me", summary="Get the authenticated user")
def me(current_user: User = Depends(get_current_user)):
    return success(UserOut.model_validate(current_user).model_dump(mode="json"))
