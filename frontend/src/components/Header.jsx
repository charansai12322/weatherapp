import React from 'react';
import { Cloud, Wifi, WifiOff, Sparkles } from 'lucide-react';

export function Header({ isConnected, isCheckingHealth, onRetryHealth }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon-wrapper" aria-hidden="true">
          <Cloud className="brand-icon" size={20} />
          <Sparkles className="brand-icon-badge" size={10} />
        </div>
        <div className="brand-text">
          <span className="brand-name">Weather AI</span>
          <span className="brand-tagline">AI WEATHER ASSISTANT</span>
        </div>
      </div>

      <div className="header-status">
        <div
          className={`status-pill ${isConnected ? 'status-connected' : 'status-disconnected'} ${isCheckingHealth ? 'status-checking' : ''}`}
          title={isConnected ? 'Backend operational (FastAPI)' : 'Backend unreachable — click to retry'}
          onClick={!isConnected ? onRetryHealth : undefined}
          role={!isConnected ? 'button' : 'status'}
          tabIndex={!isConnected ? 0 : undefined}
          aria-label={isConnected ? 'Backend system operational' : 'Backend offline, click to reconnect'}
        >
          <span className="status-dot" aria-hidden="true" />
          <span className="status-label">
            {isCheckingHealth ? 'Checking...' : isConnected ? 'System Online' : 'Backend Offline'}
          </span>
          {!isConnected && !isCheckingHealth && (
            <WifiOff size={12} className="status-icon" aria-hidden="true" />
          )}
          {isConnected && (
            <Wifi size={12} className="status-icon" aria-hidden="true" />
          )}
        </div>
      </div>
    </header>
  );
}
