import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api import analysis, applications, auth, builder, dashboard, github, jobs, linkedin, profile, resume
from app.core.config import get_settings
from app.database.database import init_db

settings = get_settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure tables and missing columns exist on startup
init_db()

app = FastAPI(title=settings.app_name, version="1.0.0", description="Secure API for AI Career & Resume Platform.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,
)


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
    return {"status": "healthy", "service": "HireLens AI Career & Resume Platform"}


@app.get("/api/templates", tags=["Templates"], summary="List 10 professional resume templates")
def get_public_templates():
    from app.api.builder import TEMPLATES_LIST
    return {"success": True, "data": TEMPLATES_LIST}


app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(linkedin.router)
app.include_router(github.router)
app.include_router(resume.router)
app.include_router(analysis.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(dashboard.router)
app.include_router(builder.router)



