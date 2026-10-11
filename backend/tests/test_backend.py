import json
import os
import sys
from pathlib import Path
import unittest
from unittest.mock import MagicMock, patch

_backend_dir = Path(__file__).resolve().parent.parent
_root_dir = _backend_dir.parent
for p in [str(_backend_dir), str(_root_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.config import (
        get_groq_api_key,
        get_weather_api_key,
        get_allowed_origins,
        get_port,
    )
    from backend.agent import (
        MODEL_NAME,
        WEATHER_TOOLS,
        get_weather,
        run_weather_agent,
    )
    from backend.main import app
except ImportError:
    from config import (
        get_groq_api_key,
        get_weather_api_key,
        get_allowed_origins,
        get_port,
    )
    from agent import (
        MODEL_NAME,
        WEATHER_TOOLS,
        get_weather,
        run_weather_agent,
    )
    from main import app

from fastapi.testclient import TestClient


class TestConfig(unittest.TestCase):
    @patch.dict(os.environ, {"GROQ_API_KEY": "test_groq_key_1"}, clear=True)
    def test_get_groq_api_key_standard(self):
        self.assertEqual(get_groq_api_key(), "test_groq_key_1")

    @patch.dict(os.environ, {"groq": "test_groq_key_legacy"}, clear=True)
    def test_get_groq_api_key_legacy(self):
        self.assertEqual(get_groq_api_key(), "test_groq_key_legacy")

    @patch.dict(os.environ, {}, clear=True)
    def test_get_groq_api_key_missing(self):
        self.assertEqual(get_groq_api_key(), "")

    @patch.dict(os.environ, {"WEATHER_API_KEY": "test_weather_key"}, clear=True)
    def test_get_weather_api_key(self):
        self.assertEqual(get_weather_api_key(), "test_weather_key")

    @patch.dict(
        os.environ,
        {"ALLOWED_ORIGINS": "https://example.com, https://test.app"},
        clear=True,
    )
    def test_get_allowed_origins_custom(self):
        self.assertEqual(
            get_allowed_origins(), ["https://example.com", "https://test.app"]
        )

    @patch.dict(os.environ, {}, clear=True)
    def test_get_allowed_origins_default(self):
        origins = get_allowed_origins()
        self.assertIn("http://localhost:5173", origins)

    @patch.dict(os.environ, {"PORT": "9000"}, clear=True)
    def test_get_port(self):
        self.assertEqual(get_port(), 9000)


class TestAgentWeatherTool(unittest.TestCase):
    @patch.dict(os.environ, {}, clear=True)
    def test_get_weather_missing_key(self):
        result_raw = get_weather("Mumbai")
        data = json.loads(result_raw)
        self.assertIn("error", data)
        self.assertIn("not configured", data["error"])

    @patch.dict(os.environ, {"WEATHER_API_KEY": "mock_key"}, clear=True)
    @patch("backend.agent.requests.get")
    def test_get_weather_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "cod": 200,
            "main": {"temp": 28.5},
            "weather": [{"description": "few clouds"}],
        }
        mock_get.return_value = mock_response

        result_raw = get_weather("Hyderabad")
        data = json.loads(result_raw)

        self.assertEqual(data["location"], "Hyderabad")
        self.assertEqual(data["temperature"], 28.5)
        self.assertEqual(data["description"], "few clouds")

        # Verify HTTPS call with parameter dictionary
        mock_get.assert_called_once()
        args, kwargs = mock_get.call_args
        self.assertTrue(args[0].startswith("https://"))
        self.assertEqual(kwargs["params"]["q"], "Hyderabad")
        self.assertEqual(kwargs["params"]["units"], "metric")

    @patch.dict(os.environ, {"WEATHER_API_KEY": "mock_key"}, clear=True)
    @patch("backend.agent.requests.get")
    def test_get_weather_api_failure(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = {"cod": 404, "message": "city not found"}
        mock_get.return_value = mock_response

        result_raw = get_weather("NonExistentCity")
        data = json.loads(result_raw)
        self.assertIn("error", data)


class TestAgentExecution(unittest.TestCase):
    def test_empty_query_raises_error(self):
        with self.assertRaises(ValueError):
            run_weather_agent("")
        with self.assertRaises(ValueError):
            run_weather_agent("   ")

    @patch.dict(os.environ, {}, clear=True)
    def test_missing_groq_key_raises_error(self):
        with self.assertRaises(RuntimeError):
            run_weather_agent("What is the weather?")

    def test_agent_single_turn_no_tool(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_message = MagicMock()
        mock_message.tool_calls = None
        mock_message.content = "I am a weather assistant. How can I help you?"
        mock_response.choices = [MagicMock(message=mock_message)]
        mock_client.chat.completions.create.return_value = mock_response

        result = run_weather_agent("Hello", client=mock_client)
        self.assertEqual(result, "I am a weather assistant. How can I help you?")
        self.assertEqual(mock_client.chat.completions.create.call_count, 1)

    @patch("backend.agent.get_weather")
    def test_agent_two_turn_tool_call(self, mock_get_weather):
        mock_get_weather.return_value = json.dumps(
            {"location": "Tokyo", "temperature": 16.0, "description": "clear sky"}
        )

        mock_client = MagicMock()

        # Turn 1: Model requests tool call
        mock_tool_call = MagicMock()
        mock_tool_call.id = "call_abc123"
        mock_tool_call.function.arguments = json.dumps({"location": "Tokyo"})
        mock_msg_turn1 = MagicMock()
        mock_msg_turn1.tool_calls = [mock_tool_call]
        mock_resp_turn1 = MagicMock(choices=[MagicMock(message=mock_msg_turn1)])

        # Turn 2: Model synthesizes final response
        mock_msg_turn2 = MagicMock()
        mock_msg_turn2.content = "The current weather in Tokyo is 16 °C with a clear sky."
        mock_resp_turn2 = MagicMock(choices=[MagicMock(message=mock_msg_turn2)])

        mock_client.chat.completions.create.side_effect = [
            mock_resp_turn1,
            mock_resp_turn2,
        ]

        result = run_weather_agent("Weather in Tokyo", client=mock_client)
        self.assertEqual(
            result, "The current weather in Tokyo is 16 °C with a clear sky."
        )
        self.assertEqual(mock_client.chat.completions.create.call_count, 2)
        mock_get_weather.assert_called_once_with("Tokyo")


class TestFastAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_chat_empty_query_rejected(self):
        response = self.client.post("/api/chat", json={"query": "  "})
        self.assertEqual(response.status_code, 422)

    @patch("backend.main.run_weather_agent")
    def test_chat_success(self, mock_run_agent):
        mock_run_agent.return_value = "The weather in Paris is sunny."
        response = self.client.post("/api/chat", json={"query": "Paris weather"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"response": "The weather in Paris is sunny."})

    @patch("backend.main.run_weather_agent")
    def test_chat_service_unavailable_on_config_error(self, mock_run_agent):
        mock_run_agent.side_effect = RuntimeError("Missing config")
        response = self.client.post("/api/chat", json={"query": "Berlin weather"})
        self.assertEqual(response.status_code, 503)


if __name__ == "__main__":
    unittest.main()
