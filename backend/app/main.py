from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="BankStat API",
    description="AI-Powered Bank Statement Analysis Application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "environment": settings.ENVIRONMENT}


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "BankStat API",
        "version": "1.0.0",
        "docs": "/docs"
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("Starting BankStat API...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"CORS Origins: {settings.CORS_ORIGINS}")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("Shutting down BankStat API...")


# Import and include routers
from app.api.routes import auth, bank_profiles, statements, transactions

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(bank_profiles.router, prefix="/api/profiles", tags=["Bank Profiles"])
app.include_router(statements.router, prefix="/api", tags=["Statements"])
app.include_router(transactions.router, prefix="/api", tags=["Transactions"])
# app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
