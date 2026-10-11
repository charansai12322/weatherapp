import logging
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

# Ensure robust import resolution whether executed from project root or backend/ directory
_current_dir = Path(__file__).resolve().parent
if str(_current_dir) not in sys.path:
    sys.path.insert(0, str(_current_dir))
if str(_current_dir.parent) not in sys.path:
    sys.path.insert(0, str(_current_dir.parent))

try:
    from backend.config import get_allowed_origins
    from backend.agent import run_weather_agent
except ImportError:
    from config import get_allowed_origins
    from agent import run_weather_agent

logger = logging.getLogger("weatherapp.backend")
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Weather Agent API",
    description="Backend API exposing the Groq-powered Weather Agent",
    version="1.0.0",
)

# Configure CORS for frontend access
allowed_origins = get_allowed_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    query: str = Field(
        ...,
        description="The weather query or message from the user",
        examples=["What is the current weather in Hyderabad?"],
    )

    @field_validator("query")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Query cannot be empty or whitespace only.")
        return v.strip()


class ChatResponse(BaseModel):
    response: str = Field(
        ...,
        description="The agent's synthesized response text",
    )


class HealthResponse(BaseModel):
    status: str = Field(default="ok")


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check endpoint",
    tags=["System"],
)
def health_check() -> HealthResponse:
    """
    Returns simple JSON health status without calling external APIs.
    Used for uptime checks and Render deployment health verification.
    """
    return HealthResponse(status="ok")


@app.post(
    "/api/chat",
    response_model=ChatResponse,
    summary="Submit query to Weather Agent",
    tags=["Agent"],
)
def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """
    Accepts user query, invokes the Weather Agent, and returns the response.
    Never exposes internal credentials or raw stack traces.
    """
    try:
        reply = run_weather_agent(request.query)
        return ChatResponse(response=reply)
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except RuntimeError as e:
        logger.error(f"Configuration/Runtime error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Weather service configuration is incomplete.",
        )
    except Exception as e:
        logger.error(f"Unexpected agent failure: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the weather request.",
        )
