(function() {
  'use strict';

  // Замените на ваш URL Apps Script (убедитесь, что нет пробелов!)
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxQoTQPStRV0ZUr5s3EFAtvgC62jbVjH2cp8VLrMPKBi3vDkoAmafVb_fC4L-jw0LBZ/exec';

  async function getIP() {
    try {
      // Убедитесь, что нет пробелов в URL
      const r = await fetch('https://api.ipify.org?format=json');
      const data = await r.json();
      return data.ip || 'unknown';
    } catch (err) {
      console.error('Ошибка получения IP:', err);
      return 'unknown';
    }
  }

  async function sendStats() {
    // === ВАЖНО ===
    // Жестко задайте правильный сайт для каждого конкретного файла JS
    // Например, для сайта gadanie-qolos.ru здесь должно быть:
    const site = 'gadanie-qolos.ru';
    // Для сайта gadanie-privoroti.ru создайте отдельный файл IP.js с этой строкой:
    // const site = 'gadanie-privoroti.ru';
    // =================
    const visitors = 1;
    const clicks = 0;
    const ip = await getIP();

    const form = new URLSearchParams();
    form.append('action', 'saveStats');
    form.append('site', site); // <-- Отправляем конкретный сайт
    form.append('visitors', visitors.toString());
    form.append('clicks_whatsapp', clicks.toString());
    form.append('ip', ip); // <-- Отправляем IP

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: form
        // Рекомендуется также добавить credentials: 'omit' для кросс-доменных запросов, если возникнут проблемы
        // credentials: 'omit' 
      });
      
      // Проверка результата может быть полезна для отладки
      // const responseData = await response.json();
      // console.log('Ответ от сервера:', responseData);

      console.log(`Статистика (1 визит) отправлена для сайта: ${site}`);
    } catch (error) {
      console.error('Ошибка сети при отправке статистики для сайта', site, ':', error);
    }
  }

  // Отправляем статистику при загрузке страницы
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sendStats);
  } else {
    sendStats();
  }
})();