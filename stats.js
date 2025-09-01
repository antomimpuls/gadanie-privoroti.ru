// создаёт stats.json в той же папке, если ещё нет
(async () => {
  const site = location.hostname;
  const today = new Date().toISOString().slice(0,10);

  // читаем текущий счётчик
  let data = {views:{}, clicks:0};
  try {
    const r = await fetch('stats.json?' + Date.now());
    data = await r.json();
  } catch {}

  // +1 просмотр
  data.views[today] = (data.views[today] || 0) + 1;

  // считаем клики по wa.me
  document.addEventListener('click', e => {
    if (e.target.href && e.target.href.includes('wa.me')) {
      data.clicks = (data.clicks || 0) + 1;
      fetch('save.php', {method:'POST', body:JSON.stringify(data)}); // см. ниже
    }
  });

  // сохраняем просмотр
  fetch('save.php', {method:'POST', body:JSON.stringify(data)});
})();