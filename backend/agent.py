import json
import logging
import requests
from groq import Groq

from backend.config import get_groq_api_key, get_weather_api_key

logger = logging.getLogger(__name__)

# Exact Groq model used in weatherapp.ipynb (Cells 2, 5, 6)
MODEL_NAME = "openai/gpt-oss-120b"

# Exact tool schema used in weatherapp.ipynb (Cell 4)
WEATHER_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a city",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City name like Mumbai, London",
                    }
                },
                "required": ["location"],
            },
        },
    }
]


def get_weather(location: str) -> str:
    """
    Fetch current weather from OpenWeatherMap API using metric units.
    Faithfully implements the logic from weatherapp.ipynb (Cell 3)
    with added HTTPS security, query parameter encoding, and network timeouts.
    Never logs or leaks the API key.
    """
    api_key = get_weather_api_key()
    if not api_key:
        logger.error("WEATHER_API_KEY is not configured.")
        return json.dumps({"error": "Weather API key is not configured."})

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": location,
        "units": "metric",
        "appid": api_key,
    }

    try:
        response = requests.get(url, params=params, timeout=10.0)
        data = response.json()

        if data.get("cod") == 200:
            return json.dumps(
                {
                    "location": location,
                    "temperature": data["main"]["temp"],
                    "description": data["weather"][0]["description"],
                }
            )
        else:
            # Preserve the notebook's fallback error contract
            error_msg = data.get("message", "Oops! Something went wrong.")
            logger.warning(f"Weather API returned non-200 code {data.get('cod')}: {error_msg}")
            return json.dumps({"error": "Oops! Something went wrong."})

    except requests.exceptions.Timeout:
        logger.error("Weather API request timed out.")
        return json.dumps({"error": "Weather service timed out."})
    except requests.exceptions.RequestException as e:
        logger.error(f"Weather API network error: {type(e).__name__}")
        return json.dumps({"error": "Oops! Something went wrong."})
    except Exception as e:
        logger.error(f"Unexpected error in get_weather: {type(e).__name__}")
        return json.dumps({"error": "Oops! Something went wrong."})


def run_weather_agent(query: str, client: Groq = None) -> str:
    """
    Execute the weather assistant dialogue for the given query.
    Preserves the notebook's two-step LLM dialogue when tool calling occurs,
    and returns immediately if the model answers directly without calling tools.
    """
    if not query or not query.strip():
        raise ValueError("Query cannot be empty.")

    if client is None:
        groq_api_key = get_groq_api_key()
        if not groq_api_key:
            raise RuntimeError("GROQ_API_KEY is not configured.")
        client = Groq(api_key=groq_api_key)

    # Exact initial messages structure from weatherapp.ipynb (Cell 5)
    llm_messages = [
        {
            "role": "system",
            "content": "You are a weather assistant. Use get_weather function when asked about weather.",
        },
        {
            "role": "user",
            "content": query.strip(),
        },
    ]

    # First Groq LLM Turn
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=llm_messages,
        tools=WEATHER_TOOLS,
        tool_choice="auto",
    )

    response_message = response.choices[0].message

    # If the model did not request any tool call, return its direct text response immediately
    if not response_message.tool_calls:
        return response_message.content or ""

    # Model requested tool call(s) - process first tool call as in notebook (Cell 5)
    tool_call = response_message.tool_calls[0]

    # Safely parse tool arguments
    try:
        arguments = json.loads(tool_call.function.arguments)
        location = arguments.get("location", query.strip())
    except (json.JSONDecodeError, AttributeError, KeyError) as e:
        logger.warning(f"Failed to parse tool call arguments: {e}")
        location = query.strip()

    # Execute weather tool
    weather_data = get_weather(location)

    # Append assistant's tool call message and tool result message to history
    llm_messages.append(response_message)
    llm_messages.append(
        {
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": weather_data,
        }
    )

    # Second Groq LLM Turn - synthesize natural language response (Cell 6)
    final_response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=llm_messages,
        tools=WEATHER_TOOLS,
        tool_choice="auto",
    )

    return final_response.choices[0].message.content or ""
