import React from 'react';
import {
  Sparkles,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudFog,
  Snowflake,
  Sunset,
  Moon,
  RotateCcw,
} from 'lucide-react';
import { THEMES } from '../utils/weatherTheme';

/**
 * Safely parses bold Markdown (**bold**) into React elements without innerHTML.
 */
function renderMarkdownSpans(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="md-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

/**
 * Safely parses markdown lines into structured React elements.
 */
function SafeMarkdownViewer({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${index}`} className="response-list">
            {currentList}
          </ul>
        );
        currentList = [];
      }
      return;
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      currentList.push(
        <li key={`li-${index}`} className="response-list-item">
          {renderMarkdownSpans(line.slice(2))}
        </li>
      );
      return;
    }

    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${index}`} className="response-list">
          {currentList}
        </ul>
      );
      currentList = [];
    }

    elements.push(
      <p key={`p-${index}`} className="response-paragraph">
        {renderMarkdownSpans(line)}
      </p>
    );
  });

  if (currentList.length > 0) {
    elements.push(
      <ul key="ul-final" className="response-list">
        {currentList}
      </ul>
    );
  }

  return <div className="response-text-body">{elements}</div>;
}

const THEME_ICONS = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  fog: CloudFog,
  snow: Snowflake,
  sunset: Sunset,
  night: Moon,
  neutral: Sparkles,
};

export function WeatherResponse({ query, response, theme, onAskAnother }) {
  const ThemeIcon = THEME_ICONS[theme] || Sparkles;
  const themeMeta = THEMES[theme] || THEMES.neutral;

  return (
    <article
      id="weather-response-card"
      className="weather-response-card"
      aria-labelledby="response-card-title"
    >
      <div className="card-top-bar">
        <div className="card-badge">
          <ThemeIcon size={14} className="badge-icon" aria-hidden="true" />
          <span id="response-card-title" className="badge-text">WEATHER INSIGHT</span>
          <span className="badge-separator" aria-hidden="true">•</span>
          <span className="badge-theme-label">{themeMeta.name}</span>
        </div>

        <button
          type="button"
          className="ask-another-btn"
          onClick={onAskAnother}
          title="Ask another question"
          aria-label="Ask another weather question"
        >
          <RotateCcw size={13} aria-hidden="true" />
          <span>New Inquiry</span>
        </button>
      </div>

      <div className="card-query-reference">
        <span className="query-quote">"{query}"</span>
      </div>

      <div className="card-content-divider" aria-hidden="true" />

      <div className="card-response-content">
        <SafeMarkdownViewer content={response} />
      </div>

      <div className="card-footer-meta">
        <span className="source-tag">Verified by Groq Reasoning & OpenWeather</span>
      </div>
    </article>
  );
}
