// ==========================================================================
// 1. CONFIGURATION & STATE VARIABLES
// ==========================================================================
const API_KEY = '44d66bb5d34a8d9712b8bea6e34ce374'; 
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Activation Elements
const searchInput = document.getElementById('search-input');
const locationBtn = document.getElementById('location-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const hourlyContainer = document.getElementById('hourly-container');
const dailyContainer = document.getElementById('daily-container');
const weatherIconContainer = document.getElementById('weather-icon-container');

// Environment Core Containers
const fogLayer = document.getElementById("fog-layer");
const cloudContainer = document.getElementById("clouds");

// Hardware FX Flags
let isRaining = false;

// Ecosystem Engine Layers (Patch-7 Injectors)
const snowContainer = document.createElement("div");
snowContainer.id = "snow-layer";
document.getElementById("weather-scene").appendChild(snowContainer);

const birdsContainer = document.createElement("div");
birdsContainer.id = "birds";
document.getElementById("weather-scene").appendChild(birdsContainer);

const leafLayer = document.createElement("div");
leafLayer.id = "leaves-layer";
document.getElementById("weather-scene").appendChild(leafLayer);

// ==========================================================================
// 2. FETCH WEATHER DATA SYSTEM
// ==========================================================================
async function fetchByCity(city) {
    try {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`);
        const geoData = await geoRes.json();
        if (!geoData.length) throw new Error('City not found');
        
        fetchWeatherData(geoData[0].lat, geoData[0].lon, geoData[0].name);
    } catch (error) {
        alert(error.message);
    }
}

async function fetchWeatherData(lat, lon, cityName) {
    try {
        const [currentRes, forecastRes, aqiRes] = await Promise.all([
            fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
            fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
            fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
        ]);

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();
        const aqiData = await aqiRes.json();

        renderWeather(currentData, forecastData, aqiData, cityName);
    } catch (error) {
        console.error("Error fetching execution matrix:", error);
    }
}

// ==========================================================================
// 3. RENDER DATA & ECOSYSTEM CONTROLLERS
// ==========================================================================
function renderWeather(current, forecast, aqiObj, cityName) {
    document.getElementById('city-name').innerText = `${cityName}, ${current.sys.country}`;
    document.getElementById('current-date').innerText = `Today, ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    document.getElementById('current-temp').innerText = Math.round(current.main.temp);
    document.getElementById('weather-desc').innerText = current.weather[0].description;

    setLocalIconAnimation(current.weather[0].id, current.weather[0].icon);
    updateTraveler(current.weather[0].main);

    if(current.weather[0].main === "Clear") {
        cloudContainer.style.display = "none";
    } else {
        cloudContainer.style.display = "block";
    }

    // STATE CONTROLLER MATRIX SWITCH
    const weatherId = current.weather[0].id;
    
    snowContainer.style.display = "none";
    isRaining = false;

    if(weatherId >= 600 && weatherId < 700) {
        snowContainer.style.display = "block";
        createSnow();
    }
    else if(weatherId >= 200 && weatherId < 600) {
        isRaining = true; 
    }
    else if(weatherId === 800) {
        showRainbow();
    }

    // Standard metric setups
    document.getElementById('humidity-val').innerText = `${current.main.humidity}%`;
    document.getElementById('wind-val').innerText = `${Math.round(current.wind.speed * 3.6)} km/h`; 
    document.getElementById('visibility-val').innerText = `${(current.visibility / 1000).toFixed(1)} km`;
    document.getElementById('rain-chance-val').innerText = forecast.list[0].pop ? `${Math.round(forecast.list[0].pop * 100)}%` : '0%';

    const aqiIndex = aqiObj.list[0].main.aqi;
    const aqiText = ["Good", "Fair", "Moderate", "Poor", "Very Poor"][aqiIndex - 1];
    document.getElementById('aqi-val').innerText = aqiIndex * 20; 
    updateBadge('.aqi-display .badge', aqiIndex, aqiText);

    document.getElementById('sunrise-time').innerText = new Date(current.sys.sunrise * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    document.getElementById('sunset-time').innerText = new Date(current.sys.sunset * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    hourlyContainer.innerHTML = '';
    forecast.list.slice(0, 8).forEach(item => {
        const time = new Date(item.dt * 1000).toLocaleTimeString([], {hour: '2-digit'});
        hourlyContainer.innerHTML += `
            <div class="hourly-item">
                <p>${time}</p>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="icon">
                <p>${Math.round(item.main.temp)}°C</p>
            </div>`;
    });

    dailyContainer.innerHTML = '';
    const dailyData = forecast.list.filter(item => item.dt_txt.includes("12:00:00"));
    dailyData.forEach(day => {
        const dayName = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        dailyContainer.innerHTML += `
            <div class="daily-row">
                <p class="day">${dayName}</p>
                <div class="daily-status">
                    <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="icon">
                    <span>${day.weather[0].main}</span>
                </div>
                <p class="daily-temp">${Math.round(day.main.temp_max)}°C / ${Math.round(day.main.temp_min)}°C</p>
            </div>`;
    });
}

function updateBadge(selector, index, text) {
    const badge = document.querySelector(selector);
    if(index <= 2) badge.className = 'badge status-good';
    else if(index === 3) badge.className = 'badge status-mod';
    else badge.className = 'badge status-warn';
    badge.innerText = text;
}

// ==========================================================================
// 4. INTERACTION & THEME CONFIGURATION
// ==========================================================================
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim() !== '') {
        fetchByCity(searchInput.value.trim());
    }
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchWeatherData(pos.coords.latitude, pos.coords.longitude, "Current Location"),
            () => alert('Location access denied.')
        );
    }
});

themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeToggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
});

window.addEventListener('DOMContentLoaded', () => fetchByCity('Delhi'));

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log(err));
}

// ==========================================================================
// 5. ICON MICRO CONTROLLERS
// ==========================================================================
function setLocalIconAnimation(id, iconCode) {
    weatherIconContainer.innerHTML = `<img id="weather-icon" style="z-index: 5; position:relative; width:90px;" src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="weather-icon">`;
    const dynamicElements = weatherIconContainer.querySelectorAll('.rain-fx, .cloud-fx, .sun-glow, .sun-ray, .mist-layer');
    dynamicElements.forEach(el => el.remove());

    if (id >= 200 && id < 600) {
        for (let i = 0; i < 25; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-fx';
            drop.style.left = `${Math.random() * 120}px`;
            drop.style.top = `${Math.random() * -30}px`;
            drop.style.animationDuration = `${0.6 + Math.random() * 0.5}s`;
            drop.style.animationDelay = `${Math.random() * 1}s`;
            weatherIconContainer.appendChild(drop);
        }
    } 
    else if (id >= 801 && id < 805) {
        for (let i = 0; i < 3; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud-fx';
            cloud.style.width = `${40 + i * 15}px`;
            cloud.style.height = `${25 + i * 5}px`;
            cloud.style.top = `${20 + i * 15}px`;
            cloud.style.left = `${10 + i * 20}px`;
            cloud.style.animationDuration = `${4 + i * 2}s`;
            weatherIconContainer.appendChild(cloud);
        }
    } 
    else if (id === 800) {
        const glow = document.createElement('div');
        glow.className = 'sun-glow';
        const rays = document.createElement('div');
        rays.className = 'sun-ray';
        weatherIconContainer.insertBefore(glow, document.getElementById('weather-icon'));
        weatherIconContainer.appendChild(rays);
    } 
    else if (id >= 700 && id < 800) {
        for (let i = 0; i < 4; i++) {
            const mist = document.createElement('div');
            mist.className = 'mist-layer';
            mist.style.top = `${30 + i * 20}px`;
            mist.style.animationDuration = `${4 + i * 1.5}s`;
            mist.style.animationDelay = `${i * 0.5}s`;
            weatherIconContainer.appendChild(mist);
        }
    }
}

// ==========================================================================
// 6. SURFACE ENVIRONMENT ENGINE
// ==========================================================================
function createFog() {
    fogLayer.innerHTML = "";
    const fog = document.createElement("div");
    fog.className = "fog";
    fog.style.bottom = "0";
    fogLayer.appendChild(fog);
}

function createSplash() {
    const land = document.getElementById("landscape");
    if (land) {
        for(let i = 0; i < 40; i++) {
            const s = document.createElement("div");
            s.className = "splash";
            s.style.left = Math.random() * 100 + "vw";
            s.style.animationDelay = Math.random() + "s";
            land.appendChild(s);
        }
    }
}

function updateTraveler(weather) {
    const umbrella = document.querySelector(".umbrella");
    if (!umbrella) return;
    weather = weather.toLowerCase();
    if (weather.includes("rain") || weather.includes("thunderstorm") || weather.includes("drizzle")) {
        umbrella.style.background = "#2979ff";
    } else if (weather.includes("clear")) {
        umbrella.style.background = "#ffb300";
    } else if (weather.includes("cloud")) {
        umbrella.style.background = "#7e57c2";
    } else {
        umbrella.style.background = "#ff4d6d";
    }
}

createFog();
createSplash();

// ==========================================================================
// 7. CANVAS RAIN AND LIGHTNING MATRIX ENGINE
// ==========================================================================
const canvas = document.getElementById("fxCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const drops = [];
for(let i = 0; i < 350; i++) {
    drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        len: 10 + Math.random() * 20,
        speed: 8 + Math.random() * 10
    });
}

function drawRain() {
    if (!isRaining) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawRain);
        return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(190, 220, 255, 0.7)";
    ctx.lineWidth = 1.2;

    for(let d of drops) {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + 2, d.y + d.len);
        ctx.stroke();

        d.y += d.speed;
        d.x += 0.6;

        if(d.y > canvas.height) {
            d.y = -20;
            d.x = Math.random() * canvas.width;
        }
    }
    requestAnimationFrame(drawRain);
}
drawRain();

const lightningGlow = document.createElement("div");
lightningGlow.className = "lightning-glow";
document.body.appendChild(lightningGlow);

// PATCH-8: Better Thunder/Vibrate Engine
function thunder() {
    lightningGlow.classList.add("flash");
    if(navigator.vibrate) {
        navigator.vibrate(80);
    }
    setTimeout(() => {
        lightningGlow.classList.remove("flash");
    }, 200);
}

setInterval(() => {
    if(isRaining && Math.random() > 0.85) {
        thunder();
    }
}, 5000);

// ==========================================================================
// 8. ASTRO SKY SYSTEM
// ==========================================================================
const stars = document.getElementById("stars");
const sun = document.getElementById("sun");
const moon = document.getElementById("moon");

for(let i = 0; i < 150; i++) {
    const s = document.createElement("div");
    s.className = "star";
    s.style.left = Math.random() * 100 + "vw";
    s.style.top = Math.random() * 60 + "vh";
    s.style.animationDelay = Math.random() * 2 + "s";
    stars.appendChild(s);
}

function updateSky() {
    const h = new Date().getHours();
    
    // PATCH-8: Sunrise / Sunset Sunrise Class Animations
    if(h >= 6 && h < 18) {
        sun.style.display = "block";
        moon.style.display = "none";
        stars.style.display = "none";
        
        // Trigger specific sunrise / sunset filters based on hour brackets
        if(h === 6 || h === 7 || h === 17 || h === 18) {
            sun.classList.add("sunrise");
        } else {
            sun.classList.remove("sunrise");
        }
    } else {
        sun.style.display = "none";
        moon.style.display = "block";
        stars.style.display = "block";
        sun.classList.remove("sunrise");
    }
}
updateSky();
setInterval(updateSky, 60000);

function createPremiumClouds() {
    cloudContainer.innerHTML = "";
    for(let i = 0; i < 12; i++) {
        const c = document.createElement("div");
        c.className = "cloud2";
        const w = 120 + Math.random() * 180;
        const h = w * 0.45;
        c.style.width = w + "px";
        c.style.height = h + "px";
        c.style.top = (20 + Math.random() * 220) + "px";
        c.style.left = (-400 - Math.random() * 600) + "px";
        c.style.animationDuration = (45 + Math.random() * 40) + "s";
        c.style.animationDelay = (-Math.random() * 60) + "s";
        c.style.opacity = .3 + Math.random() * .5;
        cloudContainer.appendChild(c);
    }
}
createPremiumClouds();

// ==========================================================================
// 9. PROCEDURAL ECOSYSTEM ENGINES (PATCH-7 & PATCH-8)
// ==========================================================================
function createSnow(){
    snowContainer.innerHTML = "";
    for(let i = 0; i < 180; i++){
        const s = document.createElement("div");
        s.className = "snow";
        s.style.left = Math.random() * 100 + "vw";
        s.style.animationDelay = Math.random() * 10 + "s";
        s.style.animationDuration = (6 + Math.random() * 6) + "s";
        s.style.opacity = Math.random();
        snowContainer.appendChild(s);
    }
}

function showRainbow(){
    const rainbowEl = document.getElementById("rainbow");
    if(rainbowEl) {
        rainbowEl.style.opacity = 1;
        setTimeout(() => { rainbowEl.style.opacity = 0; }, 8000);
    }
}

function createBirds() {
    birdsContainer.innerHTML = "";
    for(let i = 0; i < 8; i++){
        const b = document.createElement("div");
        b.className = "bird";
        b.style.top = (60 + Math.random() * 120) + "px";
        b.style.animationDelay = (i * 2) + "s";
        birdsContainer.appendChild(b);
    }
}
createBirds();

function createLeaves() {
    leafLayer.innerHTML = "";
    for(let i = 0; i < 40; i++){
        const l = document.createElement("div");
        l.className = "leaf";
        l.style.left = Math.random() * 100 + "vw";
        l.style.animationDelay = Math.random() * 10 + "s";
        l.style.animationDuration = (8 + Math.random() * 6) + "s";
        leafLayer.appendChild(l);
    }
}
createLeaves();

// PATCH-8: Shooting Star Factory Trigger
function shootingStar() {
    const star = document.createElement("div");
    star.className = "shoot";
    star.style.left = Math.random() * window.innerWidth + "px";
    star.style.top = Math.random() * 250 + "px";
    document.body.appendChild(star);
    setTimeout(() => { star.remove(); }, 1200);
}

setInterval(() => {
    if(new Date().getHours() > 19 || new Date().getHours() < 5) {
        shootingStar();
    }
}, 6000);

// PATCH-8: Procedural Atmospheric Wind Strips Generator
function createWindLines() {
    const weatherScene = document.getElementById("weather-scene");
    for(let i = 0; i < 18; i++) {
        const w = document.createElement("div");
        w.className = "wind";
        w.style.top = Math.random() * 350 + "px";
        w.style.animationDelay = Math.random() * 5 + "s";
        w.style.animationDuration = (2 + Math.random() * 3) + "s";
        weatherScene.appendChild(w);
    }
}
createWindLines();