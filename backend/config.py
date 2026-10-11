import os
from pathlib import Path

# Search and load .env from backend directory first, then root directory
_backend_dir = Path(__file__).resolve().parent
_root_dir = _backend_dir.parent


def _load_env_file(env_path: Path):
    """
    Minimal, resilient .env parser using standard library only.
    Prevents IDE 'module not found' errors and works in any environment.
    """
    if not env_path.is_file():
        return
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                # Do not overwrite variables already set in environment
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception:
        pass


_load_env_file(_backend_dir / ".env")
_load_env_file(_root_dir / ".env")


def get_groq_api_key() -> str:
    """
    Retrieve Groq API key from environment.
    Supports standard 'GROQ_API_KEY' as well as the notebook's legacy 'groq' name.
    Never exposes or logs the actual secret.
    """
    key = os.environ.get("GROQ_API_KEY") or os.environ.get("groq")
    return key.strip() if key else ""


def get_weather_api_key() -> str:
    """
    Retrieve OpenWeatherMap API key from environment.
    Never exposes or logs the actual secret.
    """
    key = os.environ.get("WEATHER_API_KEY")
    return key.strip() if key else ""


def get_allowed_origins() -> list[str]:
    """
    Retrieve CORS allowed origins as a parsed list of origins.
    Defaults to common local development URLs if not specified.
    """
    raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
    if raw_origins:
        origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
        if origins:
            return origins
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


def get_port() -> int:
    """
    Retrieve configured server port (default: 8000).
    """
    raw_port = os.environ.get("PORT", "8000")
    try:
        return int(raw_port)
    except ValueError:
        return 8000
