/**
 * Weather Theme Engine
 * 
 * Deterministically maps response text (and query) to an atmospheric visual state.
 * Important: This is purely a visual art-direction treatment.
 * It NEVER claims to be structured meteorological truth and never invents measurements.
 */

export const THEMES = {
  neutral: {
    id: 'neutral',
    name: 'Atmospheric Horizon',
    accent: '#73C8FF',
    accentSecondary: '#7CE7E1',
    description: 'Ambient atmospheric baseline',
  },
  clear: {
    id: 'clear',
    name: 'Clear Sky & Sun',
    accent: '#F59E0B',
    accentSecondary: '#38BDF8',
    description: 'Golden radiance and clear sky',
  },
  cloudy: {
    id: 'cloudy',
    name: 'Overcast & Clouds',
    accent: '#94A3B8',
    accentSecondary: '#64748B',
    description: 'Volumetric drifting cloud layers',
  },
  rain: {
    id: 'rain',
    name: 'Rain & Showers',
    accent: '#38BDF8',
    accentSecondary: '#0284C7',
    description: 'Cool blue diagonal precipitation',
  },
  storm: {
    id: 'storm',
    name: 'Thunderstorm',
    accent: '#A855F7',
    accentSecondary: '#3B82F6',
    description: 'Deep storm indigo with subtle flashes',
  },
  fog: {
    id: 'fog',
    name: 'Fog & Mist',
    accent: '#CBD5E1',
    accentSecondary: '#64748B',
    description: 'Soft horizontal drifting mist',
  },
  snow: {
    id: 'snow',
    name: 'Snow & Frost',
    accent: '#BAE6FD',
    accentSecondary: '#E0F2FE',
    description: 'Gentle drifting frost crystals',
  },
  sunset: {
    id: 'sunset',
    name: 'Twilight & Sunset',
    accent: '#FB923C',
    accentSecondary: '#C084FC',
    description: 'Amber and violet dusk radiance',
  },
  night: {
    id: 'night',
    name: 'Night Sky',
    accent: '#818CF8',
    accentSecondary: '#38BDF8',
    description: 'Deep midnight indigo with celestial glow',
  },
};

/**
 * Categorizes response text into a visual atmosphere theme.
 * Checks the agent's verified response first, falling back to query cues,
 * and defaults to 'neutral' if ambiguous.
 *
 * @param {string} responseText
 * @param {string} queryText
 * @returns {string} Theme key
 */
export function detectWeatherTheme(responseText = '', queryText = '') {
  const text = `${responseText} ${queryText}`.toLowerCase();

  if (!text.trim()) {
    return 'neutral';
  }

  // 1. Severe / Thunderstorm (highest priority)
  if (
    text.includes('thunder') ||
    text.includes('lightning') ||
    text.includes('storm') ||
    text.includes('cyclone') ||
    text.includes('squall') ||
    text.includes('tempest')
  ) {
    return 'storm';
  }

  // 2. Snow / Winter freezing
  if (
    text.includes('snow') ||
    text.includes('blizzard') ||
    text.includes('flurries') ||
    text.includes('sleet') ||
    text.includes('freezing rain') ||
    text.includes('frost') ||
    text.includes('ice storm')
  ) {
    return 'snow';
  }

  // 3. Rain / Precipitation
  if (
    text.includes('rain') ||
    text.includes('drizzle') ||
    text.includes('shower') ||
    text.includes('showers') ||
    text.includes('downpour') ||
    text.includes('precipitation')
  ) {
    return 'rain';
  }

  // 4. Fog / Mist / Haze
  if (
    text.includes('fog') ||
    text.includes('mist') ||
    text.includes('haze') ||
    text.includes('foggy') ||
    text.includes('misty') ||
    text.includes('smog') ||
    text.includes('smoke')
  ) {
    return 'fog';
  }

  // 5. Sunset / Dusk / Twilight
  if (
    text.includes('sunset') ||
    text.includes('dusk') ||
    text.includes('twilight') ||
    text.includes('golden hour') ||
    text.includes('sundown')
  ) {
    return 'sunset';
  }

  // 6. Night / Moon
  if (
    (text.includes('night') || text.includes('moon') || text.includes('midnight')) &&
    !text.includes('good night')
  ) {
    return 'night';
  }

  // 7. Clouds / Overcast
  if (
    text.includes('cloud') ||
    text.includes('clouds') ||
    text.includes('cloudy') ||
    text.includes('overcast') ||
    text.includes('gloomy')
  ) {
    return 'cloudy';
  }

  // 8. Clear / Sunny / Fair
  if (
    text.includes('clear') ||
    text.includes('sunny') ||
    text.includes('sunshine') ||
    text.includes('fair sky') ||
    text.includes('fine weather')
  ) {
    return 'clear';
  }

  // Fallback to neutral atmospheric mood
  return 'neutral';
}
