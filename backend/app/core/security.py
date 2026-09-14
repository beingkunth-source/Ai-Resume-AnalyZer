from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

import bcrypt

# Passlib compatibility patch for bcrypt 4.0+
if not hasattr(bcrypt, "__about__"):
    class _About:
        __version__ = getattr(bcrypt, "__version__", "4.0.0")
    bcrypt.__about__ = _About()

# bcrypt is deliberately limited to 72 input bytes; passlib handles normal passwords.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    try:
        return pwd_context.verify(password, password_hash)
    except Exception:
        try:
            return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
        except Exception:
            return False


def create_access_token(subject: str) -> tuple[str, int]:
    settings = get_settings()
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expires, "type": "access"}
    return (
        jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm),
        settings.access_token_expire_minutes * 60,
    )


def decode_access_token(token: str) -> str:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        subject = payload.get("sub")
        if not subject or payload.get("type") != "access":
            raise ValueError("Invalid token")
        return str(subject)
    except (JWTError, ValueError) as exc:
        raise ValueError("Could not validate credentials") from exc
