// stats.js
const STATS_API_URL =
  "https://script.google.com/macros/s/AKfycbxQoTQPStRV0ZUr5s3EFAtvgC62jbVjH2cp8VLrMPKBi3vDkoAmafVb_fC4L-jw0LBZ/exec";

function sendVisit() {
  fetch(STATS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      site: window.location.hostname,
      visitors: 1,
      clicks_whatsapp: 0
    })
  })
  .then(r => r.json())
  .then(d => console.log('Статистика (визит):', d))
  .catch(e => console.error('Ошибка отправки визита:', e));
}

function trackWhatsAppClick() {
  fetch(STATS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      site: window.location.hostname,
      visitors: 0,
      clicks_whatsapp: 1
    })
  })
  .then(r => r.json())
  .then(d => console.log('Статистика (WhatsApp):', d))
  .catch(e => console.error('Ошибка отправки клика:', e));
}

document.addEventListener('DOMContentLoaded', () => {
  sendVisit();
  document.querySelectorAll('a[href*="wa.me"], #waBtn, #waBtn2, #stickyWaBtn')
          .forEach(btn => btn.addEventListener('click', trackWhatsAppClick));
});