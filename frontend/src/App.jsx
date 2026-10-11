import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { WeatherAtmosphere } from './components/WeatherAtmosphere';
import { WeatherSearch } from './components/WeatherSearch';
import { WeatherResponse } from './components/WeatherResponse';
import { checkBackendHealth, askWeather } from './api';
import { detectWeatherTheme } from './utils/weatherTheme';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import './App.css';

export function App() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('neutral');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Backend connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);

  // Health check on mount and on demand
  const verifyHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    const result = await checkBackendHealth();
    setIsConnected(result.ok);
    setIsCheckingHealth(false);
  }, []);

  useEffect(() => {
    verifyHealth();
    // Re-verify periodically every 45 seconds
    const interval = setInterval(verifyHealth, 45000);
    return () => clearInterval(interval);
  }, [verifyHealth]);

  useEffect(() => {
    if (response) {
      setTimeout(() => {
        document.getElementById('weather-response-card')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 100);
    }
  }, [response]);

  const handleSearch = async (userQuery) => {
    if (!userQuery.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);
    setQuery(userQuery);

    try {
      const agentReply = await askWeather(userQuery);
      setResponse(agentReply);

      // Deterministically detect atmospheric visual theme from actual verified response
      const detected = detectWeatherTheme(agentReply, userQuery);
      setCurrentTheme(detected);
    } catch (err) {
      console.error('Weather inquiry failed:', err);
      setError(err.message || 'Unable to retrieve weather data at this moment.');
      // Keep or revert to neutral atmospheric theme on error
      setCurrentTheme('neutral');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskAnother = () => {
    setResponse(null);
    setError(null);
    setQuery('');
    setCurrentTheme('neutral');
    // Focus search input on next tick
    setTimeout(() => {
      document.getElementById('weather-search-input')?.focus();
    }, 50);
  };

  return (
    <div className={`app-root theme-${currentTheme}`}>
      {/* Background Cinematic Atmosphere Engine (pointer-events: none) */}
      <WeatherAtmosphere theme={currentTheme} />

      {/* Main Content Layout */}
      <div className="app-container">
        <Header
          isConnected={isConnected}
          isCheckingHealth={isCheckingHealth}
          onRetryHealth={verifyHealth}
        />

        <main className="main-content">
          {/* Hero Section */}
          <section className="hero-section" aria-labelledby="hero-headline">
            <div className="hero-pill-badge">
              <span className="pill-dot" aria-hidden="true" />
              <span>POWERED BY GROQ & OPENWEATHER</span>
            </div>

            <h1 id="hero-headline" className="hero-title">
              Weather, with a little more <span className="hero-gradient-text">intelligence.</span>
            </h1>

            <p className="hero-subtitle">
              Ask about the sky, explore the conditions, and get clear answers from your AI weather assistant.
            </p>
          </section>

          {/* Search Composer */}
          <section className="interaction-section" aria-label="Weather Query Composer">
            <WeatherSearch
              onSubmit={handleSearch}
              isLoading={isLoading}
              disabled={!isConnected && !isCheckingHealth}
            />
          </section>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="loading-state-card" role="status" aria-live="polite">
              <div className="loading-spinner-wrapper" aria-hidden="true">
                <Loader2 className="loading-spin-icon" size={24} />
              </div>
              <div className="loading-text-group">
                <p className="loading-primary-text">Consulting your weather assistant...</p>
                <p className="loading-secondary-text">Analyzing real-time atmospheric data</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && !isLoading && (
            <div className="error-banner" role="alert">
              <div className="error-icon-wrapper" aria-hidden="true">
                <AlertCircle size={20} />
              </div>
              <div className="error-content">
                <h3 className="error-title">Inquiry Encountered an Issue</h3>
                <p className="error-message">{error}</p>
                {!isConnected && (
                  <p className="error-subnote">
                    The backend service at <code>http://localhost:8000</code> appears unreachable. Please ensure the Python server is running.
                  </p>
                )}
              </div>
              <button
                type="button"
                className="error-retry-btn"
                onClick={() => handleSearch(query || "What's the weather in Hyderabad?")}
                aria-label="Retry weather query"
              >
                <RefreshCw size={14} aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Response State */}
          {response && !isLoading && !error && (
            <section className="response-section" aria-label="Weather Assistant Response">
              <WeatherResponse
                query={query}
                response={response}
                theme={currentTheme}
                onAskAnother={handleAskAnother}
              />
            </section>
          )}
        </main>

        <footer className="app-footer">
          <p className="footer-note">
            Weather AI respects live atmospheric data. Responses are synthesized by Groq reasoning over OpenWeatherMap metrics.
          </p>
        </footer>
      </div>
    </div>
  );
}
export default App;
