import React, { useMemo } from 'react';

/**
 * Cinematic Weather Atmosphere Engine
 * 
 * Provides an atmospheric, hardware-accelerated ambient backdrop
 * representing recognized weather states without interfering with UI interaction.
 */
export function WeatherAtmosphere({ theme = 'neutral' }) {
  // Generate deterministic particle collections for rain, snow, and stars
  const rainStreaks = useMemo(() => {
    return Array.from({ length: 32 }, (_, i) => ({
      id: i,
      left: `${(i * 3.12 + (i % 7) * 2.3) % 100}%`,
      delay: `${((i * 0.17) % 1.6).toFixed(2)}s`,
      duration: `${(0.65 + (i % 5) * 0.12).toFixed(2)}s`,
      opacity: (0.25 + (i % 4) * 0.15).toFixed(2),
      length: `${18 + (i % 6) * 8}px`,
    }));
  }, []);

  const snowCrystals = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: `${(i * 3.7 + 5) % 96}%`,
      delay: `${(i * 0.35) % 4}s`,
      duration: `${4 + (i % 5) * 1.2}s`,
      size: `${3 + (i % 4) * 2}px`,
      opacity: (0.3 + (i % 3) * 0.25).toFixed(2),
    }));
  }, []);

  const celestialStars = useMemo(() => {
    return Array.from({ length: 36 }, (_, i) => ({
      id: i,
      left: `${(i * 2.8 + 3) % 95}%`,
      top: `${(i * 2.3 + 4) % 65}%`,
      size: `${1 + (i % 3)}px`,
      delay: `${(i * 0.28) % 3.5}s`,
      duration: `${2.2 + (i % 4) * 0.8}s`,
      opacity: (0.2 + (i % 4) * 0.2).toFixed(2),
    }));
  }, []);

  const sunParticles = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: `${20 + (i * 5.5) % 60}%`,
      top: `${15 + (i * 6.2) % 50}%`,
      delay: `${(i * 0.5) % 3}s`,
      duration: `${4 + (i % 3) * 1.5}s`,
      size: `${6 + (i % 5) * 4}px`,
    }));
  }, []);

  return (
    <div className={`weather-atmosphere atmosphere-${theme}`} aria-hidden="true">
      {/* Base dynamic ambient gradient mesh */}
      <div className="atmosphere-backdrop" />

      {/* Layer A: Clear / Sunny */}
      {theme === 'clear' && (
        <div className="atmosphere-layer layer-clear">
          <div className="sun-core" />
          <div className="sun-halo" />
          <div className="sun-radiance" />
          <div className="sun-dust-field">
            {sunParticles.map((p) => (
              <span
                key={p.id}
                className="sun-particle"
                style={{
                  left: p.left,
                  top: p.top,
                  width: p.size,
                  height: p.size,
                  animationDelay: p.delay,
                  animationDuration: p.duration,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Layer B: Cloudy */}
      {theme === 'cloudy' && (
        <div className="atmosphere-layer layer-cloudy">
          <div className="cloud-mass cloud-mass-1" />
          <div className="cloud-mass cloud-mass-2" />
          <div className="cloud-mass cloud-mass-3" />
        </div>
      )}

      {/* Layer C: Rain */}
      {theme === 'rain' && (
        <div className="atmosphere-layer layer-rain">
          <div className="cloud-mass cloud-overcast-dark" />
          <div className="rain-field">
            {rainStreaks.map((r) => (
              <span
                key={r.id}
                className="rain-drop"
                style={{
                  left: r.left,
                  animationDelay: r.delay,
                  animationDuration: r.duration,
                  opacity: r.opacity,
                  height: r.length,
                }}
              />
            ))}
          </div>
          <div className="rain-ground-mist" />
        </div>
      )}

      {/* Layer D: Storm / Heavy Rain */}
      {theme === 'storm' && (
        <div className="atmosphere-layer layer-storm">
          <div className="storm-lightning-pulse" />
          <div className="cloud-mass cloud-storm-deep" />
          <div className="rain-field rain-heavy">
            {rainStreaks.map((r) => (
              <span
                key={r.id}
                className="rain-drop heavy"
                style={{
                  left: r.left,
                  animationDelay: r.delay,
                  animationDuration: `${parseFloat(r.duration) * 0.65}s`,
                  opacity: (parseFloat(r.opacity) + 0.2).toFixed(2),
                  height: `${parseInt(r.length) + 12}px`,
                }}
              />
            ))}
          </div>
          <div className="rain-ground-mist storm-mist" />
        </div>
      )}

      {/* Layer E: Fog / Mist */}
      {theme === 'fog' && (
        <div className="atmosphere-layer layer-fog">
          <div className="fog-stratus fog-stratus-1" />
          <div className="fog-stratus fog-stratus-2" />
          <div className="fog-stratus fog-stratus-3" />
        </div>
      )}

      {/* Layer F: Snow */}
      {theme === 'snow' && (
        <div className="atmosphere-layer layer-snow">
          <div className="snow-chill-glow" />
          <div className="snow-field">
            {snowCrystals.map((s) => (
              <span
                key={s.id}
                className="snowflake"
                style={{
                  left: s.left,
                  width: s.size,
                  height: s.size,
                  animationDelay: s.delay,
                  animationDuration: s.duration,
                  opacity: s.opacity,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Layer G: Sunset */}
      {theme === 'sunset' && (
        <div className="atmosphere-layer layer-sunset">
          <div className="sunset-horizon-glow" />
          <div className="sunset-orb" />
          <div className="sunset-twilight-wash" />
        </div>
      )}

      {/* Layer H: Night */}
      {theme === 'night' && (
        <div className="atmosphere-layer layer-night">
          <div className="moon-orb" />
          <div className="moon-halo" />
          <div className="stars-field">
            {celestialStars.map((st) => (
              <span
                key={st.id}
                className="celestial-star"
                style={{
                  left: st.left,
                  top: st.top,
                  width: st.size,
                  height: st.size,
                  animationDelay: st.delay,
                  animationDuration: st.duration,
                  opacity: st.opacity,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ambient Vignette for cinematic focus */}
      <div className="atmosphere-vignette" />
    </div>
  );
}
