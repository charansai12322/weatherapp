# Weather AI — Atmospheric Intelligence

A production-ready AI weather assistant combining **Groq LLM reasoning** (`openai/gpt-oss-120b`) with real-time **OpenWeatherMap** meteorological data and a **cinematic React + Vite frontend**.

---

## 1. Project Architecture

```
[ React + Vite Client (Port 5173) ]
           │
           │  1. GET  /health           ──► System status check ("System Online")
           │  2. POST /api/chat         ──► Query: {"query": "What's the weather in Tokyo?"}
           ▼
[ FastAPI Backend (Port 8000) ]
           │
           │  3. Formulates prompt + get_weather tool schema
           │  4. Calls Groq API (openai/gpt-oss-120b)
           ▼
[ Groq Cloud Platform ]
           │
           │  5. Emits tool_calls: {"name": "get_weather", "arguments": {"location": "Tokyo"}}
           ▼
[ OpenWeatherMap Current Weather API ]
           │
           │  6. Returns verified metrics (temp, sky description, units: metric)
           ▼
[ Groq Cloud Platform ]
           │
           │  7. Synthesizes tool output into natural-language Markdown response
           ▼
[ React + Vite Client ]
           │
           │  8. Renders "WEATHER INSIGHT" card
           │  9. Automatically shifts ambient atmosphere (clear, rain, storm, snow, fog, etc.)
```

---

## 2. Prerequisites & Software Versions

- **Python**: `3.12.10` (Windows / Linux / macOS)
- **Node.js**: `v20.x` or higher (tested on `v24.18.0` with `npm 11.16.0`)
- **Git**

---

## 3. Safe Environment Setup

### Backend Environment (`backend/.env`)
Create a `.env` file in the `backend/` directory:

```dotenv
# Groq Cloud API Key (from https://console.groq.com/keys)
GROQ_API_KEY=your_actual_groq_api_key_here

# OpenWeatherMap API Key (from https://home.openweathermap.org/api_keys)
WEATHER_API_KEY=your_actual_openweathermap_key_here

# Allowed CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000

# Server Port
PORT=8000
```

> **Security Rule**: `backend/.env` is strictly ignored by Git. Never put real keys in `backend/.env.example`.

### Frontend Environment (`frontend/.env.local`)
Create a `.env.local` file in the `frontend/` directory:

```dotenv
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:8000
```

---

## 4. Local Development (PowerShell / Windows)

### Running the Backend
```powershell
# 1. Open a terminal and navigate to backend directory
cd backend

# 2. Create and activate Python virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Start the FastAPI development server
uvicorn main:app --reload --port 8000
```
- **Health Check**: `http://localhost:8000/health`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

### Running the Frontend
```powershell
# 1. Open a second terminal and navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Vite dev server
npm run dev
```
- **Application URL**: `http://localhost:5173`

---

## 5. Automated Testing

### Backend Unit Tests
Runs 18 unit tests covering configuration, tool execution, single-turn dialogue, two-turn tool synthesis, and endpoint validation:

```powershell
# From project root:
backend\.venv\Scripts\python.exe -m unittest backend.tests.test_backend
```

### Frontend Production Build Test
Verifies compilation, syntax, and asset bundling:

```powershell
cd frontend
npm run build
```

---

## 6. Deployment Guides

### Backend Deployment (Render)
1. **Repository**: Connect `charansai12322/weatherapp` to Render as a **Web Service**.
2. **Root Directory**: `backend` *(Crucial: sets context to the backend folder)*.
3. **Environment**: `Python 3`.
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables**:
   - `PYTHON_VERSION`: `3.12.10`
   - `GROQ_API_KEY`: *(Your Groq API key)*
   - `WEATHER_API_KEY`: *(Your OpenWeatherMap key)*
   - `ALLOWED_ORIGINS`: `https://your-vercel-domain.vercel.app,http://localhost:5173`

### Frontend Deployment (Vercel)
1. **Repository**: Import `charansai12322/weatherapp` in Vercel.
2. **Framework Preset**: `Vite`.
3. **Root Directory**: `frontend`.
4. **Build Command**: `npm run build`.
5. **Output Directory**: `dist`.
6. **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://your-render-service.onrender.com` *(Do not include a trailing `/api/chat`)*.

---

## 7. Credential Rotation & Security

If an API key is ever exposed or needs rotation:
1. Revoke the key immediately in the [Groq Console](https://console.groq.com/keys) or [OpenWeatherMap Dashboard](https://home.openweathermap.org/api_keys).
2. Generate a new key.
3. Update your local `backend/.env` file.
4. Update the environment variables in your Render Dashboard.
5. Never commit keys to Git or modify `.env.example` to contain live values.