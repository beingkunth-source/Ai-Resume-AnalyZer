import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api import analysis, auth, builder, dashboard, jobs, resume
from app.core.config import get_settings
from app.database.database import init_db

settings = get_settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure tables and missing columns exist on startup
init_db()

app = FastAPI(title=settings.app_name, version="1.0.0", description="Secure API for resume uploads, ATS evaluation, AI analysis, and job matching.")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=["GET", "POST", "DELETE", "OPTIONS"], allow_headers=["Authorization", "Content-Type"], max_age=600)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"success": False, "message": str(exc.detail)})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"success": False, "message": "Request validation failed", "errors": exc.errors()})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    logger.exception("Unhandled server error", exc_info=exc)
    return JSONResponse(status_code=500, content={"success": False, "message": "An internal server error occurred"})


@app.get("/health", tags=["Health"], summary="Render health check")
def health():
    return {"status": "healthy"}


app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(analysis.router)
app.include_router(jobs.router)
app.include_router(dashboard.router)
app.include_router(builder.router)

