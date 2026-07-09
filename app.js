/**
 * Google Weather Clone - Core Logic & Rendering Engine
 * Built with Vanilla JavaScript and Open-Meteo APIs (Free, no keys required)
 */

// ==========================================================================
// CONFIGURATION & GLOBAL STATE
// ==========================================================================
const STATE = {
  currentUnit: localStorage.getItem('weather_unit') || 'C', // 'C' or 'F'
  currentCoords: { lat: 35.6895, lon: 139.6917 }, // Default: Tokyo
  currentLocationName: 'Tokyo, Japan',
  weatherData: null,
  aqiData: null,
  debounceTimer: null
};

// WMO Weather Interpretation Codes (Open-Meteo) mapped to UI details
const WEATHER_CODES = {
  0: { label: 'Clear sky', theme: 'clear', icon: 'clear' },
  1: { label: 'Mainly clear', theme: 'clear', icon: 'partly-cloudy' },
  2: { label: 'Partly cloudy', theme: 'cloudy', icon: 'partly-cloudy' },
  3: { label: 'Overcast', theme: 'cloudy', icon: 'cloudy' },
  45: { label: 'Foggy', theme: 'foggy', icon: 'fog' },
  48: { label: 'Depositing rime fog', theme: 'foggy', icon: 'fog' },
  51: { label: 'Light drizzle', theme: 'rainy', icon: 'rain' },
  53: { label: 'Moderate drizzle', theme: 'rainy', icon: 'rain' },
  55: { label: 'Dense drizzle', theme: 'rainy', icon: 'rain' },
  56: { label: 'Light freezing drizzle', theme: 'rainy', icon: 'rain' },
  57: { label: 'Dense freezing drizzle', theme: 'rainy', icon: 'rain' },
  61: { label: 'Slight rain', theme: 'rainy', icon: 'rain' },
  63: { label: 'Moderate rain', theme: 'rainy', icon: 'rain' },
  65: { label: 'Heavy rain', theme: 'rainy', icon: 'heavy-rain' },
  66: { label: 'Light freezing rain', theme: 'rainy', icon: 'rain' },
  67: { label: 'Heavy freezing rain', theme: 'rainy', icon: 'heavy-rain' },
  71: { label: 'Slight snow fall', theme: 'snowy', icon: 'snow' },
  73: { label: 'Moderate snow fall', theme: 'snowy', icon: 'snow' },
  75: { label: 'Heavy snow fall', theme: 'snowy', icon: 'heavy-snow' },
  77: { label: 'Snow grains', theme: 'snowy', icon: 'snow' },
  80: { label: 'Slight rain showers', theme: 'rainy', icon: 'rain' },
  81: { label: 'Moderate rain showers', theme: 'rainy', icon: 'rain' },
  82: { label: 'Violent rain showers', theme: 'rainy', icon: 'heavy-rain' },
  85: { label: 'Slight snow showers', theme: 'snowy', icon: 'snow' },
  86: { label: 'Heavy snow showers', theme: 'snowy', icon: 'heavy-snow' },
  95: { label: 'Thunderstorm', theme: 'rainy', icon: 'thunderstorm' },
  96: { label: 'Thunderstorm with slight hail', theme: 'rainy', icon: 'thunderstorm' },
  99: { label: 'Thunderstorm with heavy hail', theme: 'rainy', icon: 'thunderstorm' }
};

// Custom SVG Icons (Raw inline definitions with micro-animation hooks)
const SVG_ICONS = {
  'clear': (isDay) => `
    <svg viewBox="0 0 100 100" class="weather-svg-animated">
      ${isDay ? `
        <circle cx="50" cy="50" r="18" fill="var(--color-sun)" class="anim-sun" />
        <g stroke="var(--color-sun)" stroke-width="5" stroke-linecap="round" class="anim-sun">
          <line x1="50" y1="12" x2="50" y2="22" />
          <line x1="50" y1="78" x2="50" y2="88" />
          <line x1="12" y1="50" x2="22" y2="50" />
          <line x1="78" y1="50" x2="88" y2="50" />
          <line x1="23" y1="23" x2="30" y2="30" />
          <line x1="70" y1="70" x2="77" y2="77" />
          <line x1="77" y1="23" x2="70" y2="30" />
          <line x1="30" y1="70" x2="23" y2="77" />
        </g>
      ` : `
        <path d="M45,25 A25,25 0 0,0 75,55 A28,28 0 1,1 45,25" fill="#f8f9fa" />
        <circle cx="28" cy="38" r="1" fill="#fff" opacity="0.8" />
        <circle cx="68" cy="24" r="1.5" fill="#fff" opacity="0.5" />
        <circle cx="52" cy="74" r="1.2" fill="#fff" opacity="0.9" />
      `}
    </svg>
  `,
  'partly-cloudy': (isDay) => `
    <svg viewBox="0 0 100 100" class="weather-svg-animated">
      ${isDay ? `
        <circle cx="42" cy="40" r="15" fill="var(--color-sun)" class="anim-sun" />
        <g stroke="var(--color-sun)" stroke-width="4.5" stroke-linecap="round" class="anim-sun">
          <line x1="42" y1="12" x2="42" y2="20" />
          <line x1="42" y1="60" x2="42" y2="68" />
          <line x1="14" y1="40" x2="22" y2="40" />
          <line x1="64" y1="40" x2="72" y2="40" />
          <line x1="22" y1="20" x2="28" y2="26" />
          <line x1="56" y1="54" x2="62" y2="60" />
          <line x1="62" y1="20" x2="56" y2="26" />
          <line x1="28" y1="54" x2="22" y2="60" />
        </g>
      ` : `
        <path d="M38,25 A20,20 0 0,0 64,51 A24,24 0 1,1 38,25" fill="#f8f9fa" />
      `}
      <path d="M32,68 A16,16 0 0,1 48,52 A18,18 0 0,1 78,54 A15,15 0 0,1 74,84 L38,84 A12,12 0 0,1 32,68 Z" fill="var(--color-cloud)" opacity="0.9" class="anim-cloud" />
    </svg>
  `,
  'cloudy': () => `
    <svg viewBox="0 0 100 100" class="weather-svg-animated">
      <path d="M22,62 A14,14 0 0,1 36,48 A16,16 0 0,1 62,50 A13,13 0 0,1 59,76 L26,76 A10,10 0 0,1 22,62 Z" fill="#9aa0a6" opacity="0.6" class="anim-cloud" style="animation-delay: -1s;" />
      <path d="M34,68 A16,16 0 0,1 50,52 A18,18 0 0,1 80,54 A15,15 0 0,1 76,84 L40,84 A12,12 0 0,1 34,68 Z" fill="var(--color-cloud)" opacity="0.95" class="anim-cloud" />
    </svg>
  `,
  'fog': () => `
    <svg viewBox="0 0 100 100" class="weather-svg-animated">
      <path d="M25,55 A15,15 0 0,1 55,42 A17,17 0 0,1 80,55 L25,55 Z" fill="var(--color-cloud)" opacity="0.85" class="anim-cloud" />
      <line x1="20" y1="64" x2="80" y2="64" stroke="var(--color-cloud)" stroke-width="4" stroke-linecap="round" />
      <line x1="30" y1="72" x2="70" y2="72" stroke="var(--color-cloud)" stroke-width="4" stroke-linecap="round" />
      <line x1="25" y1="80" x2="75" y2="80" stroke="var(--color-cloud)" stroke-width="4" stroke-linecap="round" />
    </svg>
  `,
  'rain': () => `
    <svg viewBox="0 0 100 100" class="weather-svg-animated">
      <path d="M34,58 A16,16 0 0,1 50,42 A18,18 0 0,1 80,44 A15,15 0 0,1 76,74 L40,74 A12,12 0 0,1 34,58 Z" fill="var(--color-cloud)" class="anim-cloud" />
      <g stroke="var(--color-rain)" stroke-width="3" stroke-linecap="round" class="anim-rain-drops">
        <line x1="42" y1="78" x2="38" y2="88" />
        <line x1="54" y1="78" x2="50" y2="88" />
        <line x1="66" y1="78" x2="62" y2="88" />
      </g>
    </svg>
  `,
  'heavy-rain': () => `
    <svg viewBox="0 0 100 100" class="weather-svg-animated">
      <path d="M22,54 A14,14 0 0,1 36,40 A16,16 0 0,1 62,42 A13,13 0 0,1 59,68 L26,68 Z" fill="#9aa0a6" opacity="0.6" class="anim-cloud" />
      <path d="M34,58 A16,16 0 0,1 50,42 A18,18 0 0,1 80,44 A15,15 0 0,1 76,74 L40,74 A12,12 0 0,1 34,58 Z" fill="#75828d" class="anim-cloud" />
      <g stroke="var(--color-rain)" stroke-width="3.5" stroke-linecap="round" class="anim-rain-drops">
        <line x1="38" y1="78" x2="33" y2="90" />
        <line x1="48" y1="78" x2="43" y2="90" />
        <line x1="58" y1="78" x2="53" y2="90" />
        <line x1="68" y1="78" x2="63" y2="90" />
      </g>
    </svg>
  `,
  'thunderstorm': () => `
    <svg viewBox="0 0 100 100" class="weather-svg-animated">
      <path d="M34,56 A16,16 0 0,1 50,40 A18,18 0 0,1 80,42 A15,15 0 0,1 76,72 L40,72 A12,12 0 0,1 34,56 Z" fill="#525d6b" class="anim-cloud" />
      <polygon points="46,72 38,84 48,84 42,96 56,80 46,80" fill="var(--color-sun)" class="anim-lightning" />
      <g stroke="var(--color-rain)" stroke-width="2.5" stroke-linecap="round" class="anim-rain-drops" style="animation-duration: 0.8s;">
        <line x1="36" y1="76" x2="32" y2="86" />
        <line x1="58" y1="76" x2="54" y2="86" />
        <line x1="68" y1="76" x2="64" y2="86" />
      </g>
    </svg>
  `,
  'snow': () => `
    <svg viewBox="0 0 100 100" class="weather-svg-animated">
      <path d="M34,58 A16,16 0 0,1 50,42 A18,18 0 0,1 80,44 A15,15 0 0,1 76,74 L40,74 A12,12 0 0,1 34,58 Z" fill="var(--color-cloud)" class="anim-cloud" />
      <g fill="var(--color-snow)" stroke="var(--color-snow)" stroke-width="1">
        <circle cx="42" cy="78" r="2.5" class="anim-snowflake" />
        <circle cx="56" cy="82" r="2.5" class="anim-snowflake" />
        <circle cx="68" cy="78" r="2.5" class="anim-snowflake" />
      </g>
    </svg>
  `,
  'heavy-snow': () => `
    <svg viewBox="0 0 100 100" class="weather-svg-animated">
      <path d="M22,54 A14,14 0 0,1 36,40 A16,16 0 0,1 62,42 A13,13 0 0,1 59,68 L26,68 Z" fill="#9aa0a6" opacity="0.6" class="anim-cloud" />
      <path d="M34,58 A16,16 0 0,1 50,42 A18,18 0 0,1 80,44 A15,15 0 0,1 76,74 L40,74 A12,12 0 0,1 34,58 Z" fill="var(--color-cloud)" class="anim-cloud" />
      <g fill="var(--color-snow)" stroke="var(--color-snow)" stroke-width="1.2">
        <circle cx="36" cy="76" r="3" class="anim-snowflake" />
        <circle cx="48" cy="80" r="3" class="anim-snowflake" />
        <circle cx="60" cy="76" r="3" class="anim-snowflake" />
        <circle cx="70" cy="81" r="3" class="anim-snowflake" />
      </g>
    </svg>
  `
};

// Popular preset cities for empty search suggestions
const POPULAR_CITIES = [
  { name: 'Tokyo', country: 'Japan', latitude: 35.6895, longitude: 139.6917, admin1: 'Tokyo' },
  { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060, admin1: 'New York' },
  { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, admin1: 'England' },
  { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, admin1: 'Île-de-France' },
  { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093, admin1: 'New South Wales' }
];

// ==========================================================================
// DOM ELEMENTS REFERENCE
// ==========================================================================
const DOM = {
  searchInput: document.getElementById('search-input'),
  suggestionsBox: document.getElementById('search-suggestions'),
  geoBtn: document.getElementById('geo-btn'),
  unitCBtn: document.getElementById('unit-c'),
  unitFBtn: document.getElementById('unit-f'),
  locationName: document.getElementById('location-name'),
  currentTime: document.getElementById('current-time'),
  currentDescBadge: document.getElementById('weather-description-badge'),
  currentTemp: document.getElementById('current-temp'),
  currentWeatherIcon: document.getElementById('current-weather-icon'),
  todayHigh: document.getElementById('today-high'),
  todayLow: document.getElementById('today-low'),
  feelsLikeTemp: document.getElementById('feels-like-temp'),
  dailyForecastList: document.getElementById('daily-forecast-list'),
  hourlyList: document.getElementById('hourly-list'),
  hourlyTempSvg: document.getElementById('hourly-temp-svg'),
  graphSvgContainer: document.getElementById('graph-svg-container'),
  aqiBadge: document.getElementById('aqi-badge'),
  aqiValue: document.getElementById('aqi-value'),
  aqiStatus: document.getElementById('aqi-status'),
  valPm25: document.getElementById('val-pm25'),
  valPm10: document.getElementById('val-pm10'),
  valNo2: document.getElementById('val-no2'),
  valO3: document.getElementById('val-o3'),
  uvValue: document.getElementById('uv-value'),
  uvGaugeFill: document.getElementById('uv-gauge-fill'),
  uvStatus: document.getElementById('uv-status'),
  windNeedle: document.getElementById('wind-needle'),
  windSpeed: document.getElementById('wind-speed'),
  windDirection: document.getElementById('wind-direction'),
  sunPathFill: document.getElementById('sun-path-fill'),
  sunArcCircle: document.getElementById('sun-arc-circle'),
  sunriseTime: document.getElementById('sunrise-time'),
  sunsetTime: document.getElementById('sunset-time'),
  humidityValue: document.getElementById('humidity-value'),
  humidityDewpoint: document.getElementById('humidity-dewpoint'),
  humidityComfort: document.getElementById('humidity-comfort'),
  visibilityValue: document.getElementById('visibility-value'),
  visibilityStatus: document.getElementById('visibility-status'),
  pressureValue: document.getElementById('pressure-value'),
  pressureStatus: document.getElementById('pressure-status')
};

// ==========================================================================
// CORE WEATHER LOGIC & TRANSLATION UTILITIES
// ==========================================================================

function getWeatherDetails(code, isDay) {
  const details = WEATHER_CODES[code] || { label: 'Unspecified weather', theme: 'clear', icon: 'clear' };
  let iconName = details.icon;
  
  // Choose theme based on weather type and day/night cycle
  const postfix = isDay ? 'day' : 'night';
  const themeClass = `theme-${details.theme}-${postfix}`;

  return {
    label: details.label,
    iconSvg: SVG_ICONS[iconName] ? SVG_ICONS[iconName](isDay) : SVG_ICONS['clear'](isDay),
    themeClass: themeClass
  };
}

// Convert temperature from Celsius to current active unit
function formatTemp(celsius) {
  const temp = STATE.currentUnit === 'F' ? (celsius * 1.8 + 32) : celsius;
  return Math.round(temp);
}

// Format UTC time strings into friendly local display
function formatLocalTime(isoString, timezone) {
  const date = new Date(isoString);
  try {
    return date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    // Fallback if timezone string is invalid
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}

// ==========================================================================
// DATA API INTERACTIONS
// ==========================================================================

async function fetchWeatherData(lat, lon) {
  try {
    // 1. Forecast data (includes hourly, daily, current metrics)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,visibility&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error('Failed to fetch weather forecast');
    STATE.weatherData = await weatherRes.json();

    // 2. Air quality index metrics
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,us_aqi`;
    const aqiRes = await fetch(aqiUrl);
    if (!aqiRes.ok) throw new Error('Failed to fetch air quality');
    STATE.aqiData = await aqiRes.json();

    renderDashboard();
  } catch (error) {
    console.error('Error fetching dashboard weather data:', error);
    alert('Failed to update weather data. Please try again.');
  }
}

// Call Geocoding API for search auto-completion
async function fetchCitySuggestions(query) {
  if (!query || query.trim().length < 2) {
    renderSuggestions(POPULAR_CITIES);
    return;
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding search failed');
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      renderSuggestions(data.results);
    } else {
      renderSuggestions([]);
    }
  } catch (error) {
    console.error('Error in geocoding suggestions:', error);
  }
}

// ==========================================================================
// RENDERERS & DATA VISUALIZATIONS
// ==========================================================================

function renderDashboard() {
  if (!STATE.weatherData || !STATE.aqiData) return;

  const current = STATE.weatherData.current;
  const hourly = STATE.weatherData.hourly;
  const daily = STATE.weatherData.daily;
  const timezone = STATE.weatherData.timezone;

  // 1. Theme Configuration
  const isDay = current.is_day === 1;
  const weatherDetails = getWeatherDetails(current.weather_code, isDay);
  document.body.className = weatherDetails.themeClass;

  // 2. Current Weather Card
  DOM.locationName.textContent = STATE.currentLocationName;
  DOM.currentDescBadge.textContent = weatherDetails.label;
  DOM.currentTemp.textContent = formatTemp(current.temperature_2m);
  DOM.currentWeatherIcon.innerHTML = weatherDetails.iconSvg;
  DOM.todayHigh.textContent = `${formatTemp(daily.temperature_2m_max[0])}°`;
  DOM.todayLow.textContent = `${formatTemp(daily.temperature_2m_min[0])}°`;
  DOM.feelsLikeTemp.textContent = `${formatTemp(current.apparent_temperature)}°`;
  DOM.currentTime.textContent = `Updated: ${formatLocalTime(current.time, timezone)}`;

  // 3. 7-Day Forecast Rendering (Relative Range Bars)
  DOM.dailyForecastList.innerHTML = '';
  
  // Calculate absolute min/max of the week for range-bar mapping
  const minOfAll = Math.min(...daily.temperature_2m_min);
  const maxOfAll = Math.max(...daily.temperature_2m_max);
  const totalWeekDelta = maxOfAll - minOfAll;

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(daily.time[i]);
    let dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
    if (i === 0) dayName = 'Today';

    const dayCode = daily.weather_code[i];
    const dayWeather = getWeatherDetails(dayCode, true);
    const rainProb = hourly.precipitation_probability ? Math.max(...hourly.precipitation_probability.slice(i * 24, (i + 1) * 24)) : 0;

    const dayMin = daily.temperature_2m_min[i];
    const dayMax = daily.temperature_2m_max[i];

    // Compute relative range bar bounds
    let leftPct = 0;
    let rightPct = 0;
    if (totalWeekDelta > 0) {
      leftPct = ((dayMin - minOfAll) / totalWeekDelta) * 100;
      rightPct = ((maxOfAll - dayMax) / totalWeekDelta) * 100;
    }

    const row = document.createElement('div');
    row.className = 'daily-item';
    row.innerHTML = `
      <div class="daily-day-info">
        <span class="daily-name">${dayName}</span>
        <div class="daily-icon-box">
          <div class="daily-icon">${dayWeather.iconSvg}</div>
          ${rainProb > 20 ? `<span class="daily-precip">${rainProb}%</span>` : ''}
        </div>
      </div>
      <div class="daily-temp-range-bar">
        <span class="daily-low-num">${formatTemp(dayMin)}°</span>
        <div class="range-bar-bg">
          <div class="range-bar-fill" style="left: ${leftPct}%; right: ${rightPct}%;"></div>
        </div>
        <span class="daily-high-num">${formatTemp(dayMax)}°</span>
      </div>
    `;
    DOM.dailyForecastList.appendChild(row);
  }

  // 4. Hourly Scroll Forecast & Temperature Spline Graph
  DOM.hourlyList.innerHTML = '';
  
  // Extract 24 hours of data starting from current hour
  const currentHourISO = current.time.substring(0, 13) + ':00';
  let startIndex = hourly.time.findIndex(t => t.startsWith(currentHourISO));
  if (startIndex === -1) startIndex = 0;
  
  const next24Hours = {
    times: hourly.time.slice(startIndex, startIndex + 24),
    temps: hourly.temperature_2m.slice(startIndex, startIndex + 24),
    codes: hourly.weather_code.slice(startIndex, startIndex + 24),
    precip: hourly.precipitation_probability.slice(startIndex, startIndex + 24)
  };

  // Render hourly list items
  next24Hours.times.forEach((timeStr, idx) => {
    const hrDate = new Date(timeStr);
    let hrLabel = hrDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    if (idx === 0) hrLabel = 'Now';

    const hrCode = next24Hours.codes[idx];
    const hrWeather = getWeatherDetails(hrCode, isDay || (hrDate.getHours() > 6 && hrDate.getHours() < 19));
    const hrPrecip = next24Hours.precip[idx];

    const hourItem = document.createElement('div');
    hourItem.className = 'hour-item';
    hourItem.innerHTML = `
      <span class="hour-time">${hrLabel}</span>
      <div class="hour-icon">${hrWeather.iconSvg}</div>
      <span class="hour-precip">${hrPrecip > 10 ? hrPrecip + '%' : ''}</span>
    `;
    DOM.hourlyList.appendChild(hourItem);
  });

  // Calculate & Draw the Temperature SVG Spline Line Graph
  drawHourlyTempGraph(next24Hours.temps);

  // 5. Air Quality Index Card
  const aqiCurrent = STATE.aqiData.current;
  const aqiVal = Math.round(aqiCurrent.us_aqi);
  DOM.aqiValue.textContent = aqiVal;
  
  let aqiText = 'Good';
  let aqiClass = 'aqi-1';
  if (aqiVal > 300) { aqiText = 'Hazardous'; aqiClass = 'aqi-5'; }
  else if (aqiVal > 200) { aqiText = 'Very Unhealthy'; aqiClass = 'aqi-5'; }
  else if (aqiVal > 150) { aqiText = 'Unhealthy'; aqiClass = 'aqi-4'; }
  else if (aqiVal > 100) { aqiText = 'Unhealthy for Sensitive'; aqiClass = 'aqi-3'; }
  else if (aqiVal > 50) { aqiText = 'Moderate'; aqiClass = 'aqi-2'; }
  
  DOM.aqiStatus.textContent = aqiText;
  DOM.aqiBadge.textContent = `${aqiVal} US AQI`;
  DOM.aqiBadge.className = `aqi-badge ${aqiClass}`;
  
  DOM.valPm25.textContent = `${Math.round(aqiCurrent.pm2_5)} µg/m³`;
  DOM.valPm10.textContent = `${Math.round(aqiCurrent.pm10)} µg/m³`;
  DOM.valNo2.textContent = `${Math.round(aqiCurrent.nitrogen_dioxide)} µg/m³`;
  DOM.valO3.textContent = `${Math.round(aqiCurrent.ozone)} µg/m³`;

  // 6. UV Index
  const maxUV = Math.round(daily.uv_index_max[0]);
  DOM.uvValue.textContent = maxUV;
  
  let uvLabel = 'Low';
  if (maxUV >= 11) uvLabel = 'Extreme';
  else if (maxUV >= 8) uvLabel = 'Very High';
  else if (maxUV >= 6) uvLabel = 'High';
  else if (maxUV >= 3) uvLabel = 'Moderate';
  DOM.uvStatus.textContent = `${uvLabel} risk`;

  // Animate the semi-circle gauge (arc length is ~125.6)
  const uvDashoffset = 125.6 - Math.min(maxUV / 11, 1) * 125.6;
  DOM.uvGaugeFill.style.strokeDashoffset = uvDashoffset;

  // 7. Wind Details (Compass orientation)
  const wSpeed = Math.round(current.wind_speed_10m);
  const wDir = current.wind_direction_10m;
  DOM.windSpeed.textContent = wSpeed;
  DOM.windNeedle.style.transform = `rotate(${wDir}deg)`;

  // Map degree direction to cardinal points
  const windLabels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const labelIndex = Math.round(wDir / 45) % 8;
  DOM.windDirection.textContent = `${windLabels[labelIndex]} (${wDir}°)`;

  // 8. Sunrise & Sunset Solar Arc calculation
  const sunriseStr = daily.sunrise[0];
  const sunsetStr = daily.sunset[0];
  const srLocal = formatLocalTime(sunriseStr, timezone);
  const ssLocal = formatLocalTime(sunsetStr, timezone);
  DOM.sunriseTime.textContent = srLocal;
  DOM.sunsetTime.textContent = ssLocal;

  calculateSolarPosition(sunriseStr, sunsetStr, current.time);

  // 9. Humidity details
  const humidity = current.relative_humidity_2m;
  DOM.humidityValue.textContent = humidity;
  
  // Dew point approximation: Td = T - ((100 - RH)/5)
  const dewPoint = current.temperature_2m - ((100 - humidity) / 5);
  DOM.humidityDewpoint.textContent = `${formatTemp(dewPoint)}°`;

  let comfort = 'Comfortable';
  if (humidity > 70) comfort = 'Humid & sticky';
  else if (humidity < 30) comfort = 'Dry air';
  DOM.humidityComfort.textContent = comfort;

  // 10. Visibility & Pressure details
  const visKm = (current.visibility / 1000).toFixed(1);
  DOM.visibilityValue.textContent = visKm;
  let visText = 'Very Clear';
  if (visKm < 3) visText = 'Heavy Fog';
  else if (visKm < 8) visText = 'Haze/Mist';
  DOM.visibilityStatus.textContent = visText;

  const presHpa = Math.round(current.pressure_msl);
  DOM.pressureValue.textContent = presHpa;
  let presText = 'Normal';
  if (presHpa > 1020) presText = 'High pressure';
  else if (presHpa < 1009) presText = 'Low pressure';
  DOM.pressureStatus.textContent = presText;
}

// Compute custom curves (Catmull-Rom) to overlay temperature labels above points
function drawHourlyTempGraph(temps) {
  // Read exact width matching CSS measurements to avoid layout jumps
  const hourWidth = 72;
  const gapWidth = 16;
  const containerPadding = 0; // margin offset
  
  const pointsCount = temps.length;
  const width = pointsCount * hourWidth + (pointsCount - 1) * gapWidth;
  const height = 120;
  
  // Set dimensions for SVG
  DOM.hourlyTempSvg.setAttribute('width', width);
  DOM.hourlyTempSvg.setAttribute('height', height);
  DOM.graphSvgContainer.style.width = `${width}px`;

  // Map temperatures to coordinates
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const delta = maxTemp - minTemp;
  
  const paddingY = 32; // Spacing for labels at the top
  const graphHeight = height - paddingY - 16;

  const points = temps.map((temp, i) => {
    const x = i * (hourWidth + gapWidth) + (hourWidth / 2);
    let y = paddingY + graphHeight / 2;
    if (delta > 0) {
      y = paddingY + (graphHeight - ((temp - minTemp) / delta) * graphHeight);
    }
    return { x, y, temp };
  });

  // Calculate paths
  let linePath = `M ${points[0].x} ${points[0].y}`;
  let areaPath = `M ${points[0].x} ${height} L ${points[0].x} ${points[0].y}`;

  // Catmull-Rom interpolation to draw smooth cubic paths
  for (let i = 0; i < pointsCount - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    
    // Control point distance multiplier
    const dx = (next.x - curr.x) / 3;
    
    const cp1x = curr.x + dx;
    const cp1y = curr.y;
    
    const cp2x = next.x - dx;
    const cp2y = next.y;

    linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    areaPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }

  areaPath += ` L ${points[pointsCount - 1].x} ${height} Z`;

  // Draw in the SVG
  DOM.hourlyTempSvg.innerHTML = `
    <defs>
      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.0"/>
      </linearGradient>
    </defs>
    <!-- Filled spline shape underneath -->
    <path d="${areaPath}" fill="url(#areaGrad)" />
    <!-- Curved weather spline line -->
    <path d="${linePath}" fill="none" stroke="var(--color-primary)" stroke-width="2.5" />
    <!-- Numeric Temperature labels above points -->
    ${points.map(p => `
      <text x="${p.x}" y="${p.y - 12}" text-anchor="middle" font-family="var(--font-primary)" font-size="13" font-weight="600" fill="var(--color-text-primary)">
        ${formatTemp(p.temp)}°
      </text>
      <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="var(--color-primary)" stroke="var(--color-card-bg)" stroke-width="1.5" />
    `).join('')}
  `;
}

// Calculate the Sun's position along the semi-circular solar path
function calculateSolarPosition(sunriseStr, sunsetStr, currentTimeStr) {
  const sunrise = new Date(sunriseStr).getTime();
  const sunset = new Date(sunsetStr).getTime();
  const current = new Date(currentTimeStr).getTime();

  // If sunset precedes sunrise or time ranges are invalid, default sun state
  if (isNaN(sunrise) || isNaN(sunset) || isNaN(current) || current < sunrise || current > sunset) {
    // It's night time
    DOM.sunPathFill.style.strokeDashoffset = 125.6; // No fill
    DOM.sunArcCircle.setAttribute('cx', 10);
    DOM.sunArcCircle.setAttribute('cy', 40);
    DOM.sunArcCircle.style.display = 'none'; // Hide the sun dot
    return;
  }

  DOM.sunArcCircle.style.display = 'block';

  // Calculate percentage of day elapsed (0 to 1)
  const dayDuration = sunset - sunrise;
  const elapsed = current - sunrise;
  const pct = Math.max(0, Math.min(1, elapsed / dayDuration));

  // Stroke offset animations
  const arcOffset = 125.6 - pct * 125.6;
  DOM.sunPathFill.style.strokeDashoffset = arcOffset;

  // Calculate circular angle theta (radians) from PI to 0
  const theta = Math.PI - pct * Math.PI;
  const R = 40;
  const cx = 50 + R * Math.cos(theta);
  const cy = 40 - R * Math.sin(theta);

  DOM.sunArcCircle.setAttribute('cx', cx);
  DOM.sunArcCircle.setAttribute('cy', cy);
}

// ==========================================================================
// SEARCH & AUTOCOMPLETE CONTROL
// ==========================================================================

function renderSuggestions(list) {
  DOM.suggestionsBox.innerHTML = '';
  
  if (list.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'suggestion-item';
    emptyMsg.style.cursor = 'default';
    emptyMsg.innerHTML = '<span style="color: var(--color-text-secondary)">No locations found</span>';
    DOM.suggestionsBox.appendChild(emptyMsg);
    DOM.suggestionsBox.classList.remove('hidden');
    return;
  }

  list.forEach(city => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    
    // Add extra qualifiers (region and country name)
    const region = city.admin1 ? `<span class="suggestion-region">${city.admin1}</span>` : '';
    const country = city.country ? `<span class="suggestion-country">${city.country}</span>` : '';
    
    item.innerHTML = `
      <div>
        <span class="suggestion-city">${city.name}</span>
        ${region}
      </div>
      ${country}
    `;

    item.addEventListener('click', () => {
      DOM.searchInput.value = '';
      DOM.suggestionsBox.classList.add('hidden');
      
      STATE.currentCoords = { lat: city.latitude, lon: city.longitude };
      STATE.currentLocationName = `${city.name}${city.country ? ', ' + city.country : ''}`;
      
      // Save location in local storage for session recovery
      localStorage.setItem('weather_last_lat', city.latitude);
      localStorage.setItem('weather_last_lon', city.longitude);
      localStorage.setItem('weather_last_name', STATE.currentLocationName);

      fetchWeatherData(city.latitude, city.longitude);
    });

    DOM.suggestionsBox.appendChild(item);
  });

  DOM.suggestionsBox.classList.remove('hidden');
}

// ==========================================================================
// INITIALIZATION & EVENT LISTENERS
// ==========================================================================

function initApp() {
  // Restore units
  if (STATE.currentUnit === 'F') {
    DOM.unitCBtn.classList.remove('active');
    DOM.unitFBtn.classList.add('active');
  } else {
    DOM.unitFBtn.classList.remove('active');
    DOM.unitCBtn.classList.add('active');
  }

  // Restore last searched coordinates or load default
  const savedLat = localStorage.getItem('weather_last_lat');
  const savedLon = localStorage.getItem('weather_last_lon');
  const savedName = localStorage.getItem('weather_last_name');

  if (savedLat && savedLon && savedName) {
    STATE.currentCoords = { lat: parseFloat(savedLat), lon: parseFloat(savedLon) };
    STATE.currentLocationName = savedName;
  }

  // Trigger weather pull
  fetchWeatherData(STATE.currentCoords.lat, STATE.currentCoords.lon);

  // --- Search Input Listeners ---
  DOM.searchInput.addEventListener('input', (e) => {
    clearTimeout(STATE.debounceTimer);
    const value = e.target.value;

    STATE.debounceTimer = setTimeout(() => {
      fetchCitySuggestions(value);
    }, 300); // Debounce typing API requests
  });

  DOM.searchInput.addEventListener('focus', () => {
    // Show defaults/presets if search bar is blank
    if (DOM.searchInput.value.trim().length === 0) {
      renderSuggestions(POPULAR_CITIES);
    }
  });

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!DOM.searchInput.contains(e.target) && !DOM.suggestionsBox.contains(e.target)) {
      DOM.suggestionsBox.classList.add('hidden');
    }
  });

  // --- Unit Toggle Listeners ---
  DOM.unitCBtn.addEventListener('click', () => {
    if (STATE.currentUnit !== 'C') {
      STATE.currentUnit = 'C';
      localStorage.setItem('weather_unit', 'C');
      DOM.unitFBtn.classList.remove('active');
      DOM.unitCBtn.classList.add('active');
      renderDashboard(); // Re-render local displays
    }
  });

  DOM.unitFBtn.addEventListener('click', () => {
    if (STATE.currentUnit !== 'F') {
      STATE.currentUnit = 'F';
      localStorage.setItem('weather_unit', 'F');
      DOM.unitCBtn.classList.remove('active');
      DOM.unitFBtn.classList.add('active');
      renderDashboard(); // Re-render local displays
    }
  });

  // --- Geolocation Click ---
  DOM.geoBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
      DOM.locationName.textContent = 'Detecting location...';
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          STATE.currentCoords = { lat, lon };
          STATE.currentLocationName = 'My Location';
          
          // Call geocode to resolve coordinate name if possible (or label it "My Location")
          try {
            const reverseGeocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
            const geoRes = await fetch(reverseGeocodeUrl, {
              headers: { 'Accept-Language': 'en' }
            });
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              const city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.municipality || 'My Location';
              const country = geoData.address.country || '';
              STATE.currentLocationName = `${city}${country ? ', ' + country : ''}`;
            }
          } catch (err) {
            console.warn('Reverse geocoding name lookup failed, using default coordinate labeling.', err);
          }

          localStorage.setItem('weather_last_lat', lat);
          localStorage.setItem('weather_last_lon', lon);
          localStorage.setItem('weather_last_name', STATE.currentLocationName);

          fetchWeatherData(lat, lon);
        },
        (error) => {
          console.warn('Geolocation access denied/failed:', error);
          alert('Unable to retrieve location. Please search manually in the search bar.');
          DOM.locationName.textContent = STATE.currentLocationName;
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  });

  // Adjust graph dynamically on window resize
  window.addEventListener('resize', () => {
    if (STATE.weatherData) {
      const startIndex = STATE.weatherData.hourly.time.findIndex(t => t.startsWith(STATE.weatherData.current.time.substring(0, 13) + ':00'));
      const activeTemps = STATE.weatherData.hourly.temperature_2m.slice(startIndex !== -1 ? startIndex : 0, (startIndex !== -1 ? startIndex : 0) + 24);
      drawHourlyTempGraph(activeTemps);
    }
  });
}

// Run app
window.addEventListener('DOMContentLoaded', initApp);
