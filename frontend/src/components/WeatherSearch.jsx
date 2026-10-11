import React, { useState } from 'react';
import { Search, ArrowRight, Loader2, Compass } from 'lucide-react';

const SUGGESTIONS = [
  "What's the weather in Hyderabad?",
  "Tell me about the weather in Tokyo.",
  "What's the current weather in London?",
  "Describe today's weather in Mumbai.",
];

export function WeatherSearch({ onSubmit, isLoading, disabled }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim() || isLoading || disabled) return;
    onSubmit(query.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (suggestion) => {
    if (isLoading || disabled) return;
    setQuery(suggestion);
    onSubmit(suggestion);
  };

  return (
    <div className="search-section">
      <form className="search-composer-form" onSubmit={handleSubmit} role="search">
        <div className="search-input-wrapper">
          <Search className="search-lead-icon" size={20} aria-hidden="true" />
          <input
            id="weather-search-input"
            type="text"
            className="search-input"
            placeholder="Ask about the weather in any city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || disabled}
            autoComplete="off"
            spellCheck="false"
            aria-label="Ask about the weather in any city"
          />
          <button
            type="submit"
            className={`search-submit-btn ${query.trim() ? 'has-query' : ''}`}
            disabled={!query.trim() || isLoading || disabled}
            aria-label="Submit weather inquiry"
          >
            {isLoading ? (
              <Loader2 className="btn-spinner" size={18} aria-hidden="true" />
            ) : (
              <ArrowRight size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </form>

      {/* Suggestion Chips */}
      <div className="suggestions-container" aria-label="Suggested weather inquiries">
        <div className="suggestions-header">
          <Compass size={13} className="suggestions-icon" aria-hidden="true" />
          <span>Quick Inquiries</span>
        </div>
        <div className="suggestions-list" role="list">
          {SUGGESTIONS.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="suggestion-chip"
              onClick={() => handleChipClick(suggestion)}
              disabled={isLoading || disabled}
              role="listitem"
            >
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
