const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KYIV = { lat: 50.45, lon: 30.52, name: 'Київ' };
const icon = c => c === 0 ? '☀️' : c < 3 ? '🌤️' : c === 3 ? '☁️' : c < 50 ? '🌫️' : c < 70 ? '🌧️' : c < 80 ? '❄️' : c < 90 ? '🌦️' : '⛈️';
const deg = n => (n > 0 ? '+' : '') + Math.round(n) + '°';

async function weather(pos) {
  const el = $('#wx'); if (!el) return;
  try {
    const r = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.lat}&longitude=${pos.lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`)).json();
    el.innerHTML = `${icon(r.current.weather_code)} ${esc(pos.name)} <b>${deg(r.current.temperature_2m)}</b> <span>${deg(r.daily.temperature_2m_min[0])}…${deg(r.daily.temperature_2m_max[0])}</span>`;
  } catch { el.textContent = 'Погода недоступна'; }
}

function locate(ask) {
  if (!ask) {
    const saved = JSON.parse(localStorage.getItem('geo') || 'null');
    if (saved) return weather(saved);
    if (localStorage.getItem('geo-no')) return weather(KYIV);
  }
  if (!navigator.geolocation) return weather(KYIV);
  navigator.geolocation.getCurrentPosition(async p => {
    const pos = { lat: p.coords.latitude, lon: p.coords.longitude, name: 'Ваше місто' };
    try {
      const g = await (await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.lat}&longitude=${pos.lon}&localityLanguage=uk`)).json();
      pos.name = g.city || g.locality || pos.name;
    } catch {}
    localStorage.setItem('geo', JSON.stringify(pos)); localStorage.removeItem('geo-no'); weather(pos);
  }, () => { localStorage.setItem('geo-no', '1'); weather(KYIV); }, { timeout: 8000 });
}

async function rates() {
  for (const c of ['USD', 'EUR']) {
    const el = $('#' + c.toLowerCase()); if (!el) continue;
    try {
      const [r] = await (await fetch(`https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${c}&json`)).json();
      el.innerHTML = `${c === 'USD' ? '$' : '€'} <b>${r.rate.toFixed(2)}</b>`;
      el.title = `Офіційний курс НБУ на ${r.exchangedate}`;
    } catch { el.hidden = true; }
  }
}

locate(); rates();
document.addEventListener('click', e => { if (e.target.closest('#wx')) locate(true); });
