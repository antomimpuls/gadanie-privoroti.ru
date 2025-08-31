// analytics.js - глобальный счётчик статистики (исправленная версия)
(function() {
  'use strict';

  // Конфигурация
  const CONFIG = {
    // УДАЛИТЬ ТОКЕН ИЗ КОДА! Использовать переменные окружения или другой безопасный метод
    GITHUB_TOKEN: '', // Будет устанавливаться через init()
    REPO_OWNER: 'antomimpuls',
    REPO_NAME: 'gadanie-privoroti.ru',
    FILE_PATH: 'global-stats.json',
    BADGE_ID: 'global-stats-badge',
    UPDATE_INTERVAL: 3000
  };

  // Вспомогательные функции
  const Utils = {
    formatDate: (date = new Date()) => date.toISOString().split('T')[0],
    addDays: (date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    },
    getYesterday: () => Utils.formatDate(Utils.addDays(new Date(), -1)),
    encodeBase64: (str) => btoa(unescape(encodeURIComponent(str))),
    decodeBase64: (str) => decodeURIComponent(escape(atob(str)))
  };

  // Работа с GitHub
  const GitHubService = {
    getRawUrl() {
      return `https://raw.githubusercontent.com/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/main/${CONFIG.FILE_PATH}?t=${Date.now()}`;
    },
    
    getApiUrl() {
      return `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`;
    },
    
    async getFile() {
      try {
        console.log('Попытка получить файл:', this.getRawUrl());
        const response = await fetch(this.getRawUrl(), {
          cache: 'no-cache'
        });
        console.log('Ответ от GitHub:', response.status);
        
        if (!response.ok) {
          // Если файл не существует, возвращаем пустой объект
          if (response.status === 404) {
            console.log('Файл не найден, создаем новый');
            return {};
          }
          throw new Error(`HTTP ${response.status}`);
        }
        
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        console.log('Полученные данные:', data);
        return data;
      } catch (error) {
        console.warn('Ошибка получения статистики:', error);
        return {};
      }
    },
    
    async getFileSha() {
      try {
        if (!CONFIG.GITHUB_TOKEN) return null;
        
        const response = await fetch(this.getApiUrl(), {
          headers: { 'Authorization': `token ${CONFIG.GITHUB_TOKEN}` }
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.sha || null;
      } catch {
        return null;
      }
    },
    
    async updateFile(content, message = 'Update stats') {
      try {
        if (!CONFIG.GITHUB_TOKEN) {
          console.warn('GitHub токен не установлен');
          return false;
        }
        
        console.log('Попытка сохранить данные:', content);
        const sha = await this.getFileSha();
        const contentStr = JSON.stringify(content, null, 2);
        const encodedContent = Utils.encodeBase64(contentStr);
        
        const response = await fetch(this.getApiUrl(), {
          method: 'PUT',
          headers: { 
            'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message,
            content: encodedContent,
            sha: sha || undefined
          })
        });
        
        console.log('Ответ сохранения:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Ошибка GitHub API:', errorData);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Ошибка сохранения файла:', error);
        return false;
      }
    }
  };

  // Статистика
  const StatsManager = {
    cache: null,
    lastUpdate: 0,
    
    async get(force = false) {
      try {
        const now = Date.now();
        // Кэшируем данные на 1 секунду
        if (!force && this.cache && now - this.lastUpdate < 1000) {
          return this.cache;
        }
        
        this.cache = await GitHubService.getFile();
        this.lastUpdate = now;
        return this.cache;
      } catch {
        return {};
      }
    },
    
    async save(data) {
      try {
        const result = await GitHubService.updateFile(data);
        console.log('Результат сохранения:', result);
        if (result) {
          this.cache = data; // Обновляем кэш
        }
        return result;
      } catch {
        return false;
      }
    },
    
    async increment(type) {
      try {
        const today = Utils.formatDate();
        console.log(`Увеличиваем ${type} для даты ${today}`);
        
        const data = await this.get();
        
        if (!data[today]) {
          data[today] = { views: 0, whatsapp: 0 };
        }
        
        data[today][type] = (data[today][type] || 0) + 1;
        console.log('Новые данные для сохранения:', data);
        
        const saveResult = await this.save(data);
        console.log('Сохранение успешно:', saveResult);
        
        // Обновляем UI если открыт
        if (window.GlobalAnalytics && window.GlobalAnalytics.isAdmin) {
          window.GlobalAnalytics.updateAdminUI();
        }
        
        return saveResult;
      } catch (error) {
        console.error('Ошибка увеличения счетчика:', error);
        return false;
      }
    }
  };

  // UI компонент для отображения статистики
  const StatsBadge = {
    element: null,
    currentData: {},
    
    create() {
      if (this.element) return this.element;
      
      this.element = document.createElement('div');
      this.element.id = CONFIG.BADGE_ID;
      
      this.element.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-weight: bold; font-size: 16px;">📊 Аналитика</div>
          <button id="close-stats" style="background: none; border: none; color: #a0aec0; font-size: 20px; cursor: pointer;">×</button>
        </div>
        
        <div style="margin-bottom: 16px;">
          <input type="date" id="stats-date-picker" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #4a5568; background: #1a202c; color: white;">
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
          <button id="btn-today" style="padding: 8px; background: #4a5568; border: none; border-radius: 4px; color: white; cursor: pointer;">Сегодня</button>
          <button id="btn-yesterday" style="padding: 8px; background: #4a5568; border: none; border-radius: 4px; color: white; cursor: pointer;">Вчера</button>
        </div>
        
        <div id="stats-display" style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>👀 Просмотры:</span>
            <span id="views-count" style="font-weight: bold;">0</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>📱 WhatsApp:</span>
            <span id="whatsapp-count" style="font-weight: bold;">0</span>
          </div>
        </div>
        
        <div id="date-stats" style="font-size: 12px; color: #a0aec0; margin-bottom: 8px;"></div>
        <div id="last-update" style="font-size: 11px; color: #718096; margin-bottom: 8px;"></div>
        
        <div style="font-size: 11px; color: #718096; text-align: center;">
          🌍 Все устройства | Обновление каждые 3 сек
        </div>
      `;
      
      this.element.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2d3748;
        border: 1px solid #4a5568;
        border-radius: 8px;
        padding: 16px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        color: #e2e8f0;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 300px;
        backdrop-filter: blur(10px);
        background: rgba(45, 55, 72, 0.95);
      `;
      
      this.bindEvents();
      return this.element;
    },
    
    bindEvents() {
      // Закрытие статистики
      const closeBtn = this.element.querySelector('#close-stats');
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
      
      // Выбор даты
      const datePicker = this.element.querySelector('#stats-date-picker');
      datePicker.value = Utils.formatDate();
      datePicker.addEventListener('change', (e) => {
        this.updateForDate(e.target.value);
      });
      
      // Кнопки быстрого выбора
      const todayBtn = this.element.querySelector('#btn-today');
      const yesterdayBtn = this.element.querySelector('#btn-yesterday');
      
      todayBtn.addEventListener('click', () => {
        const today = Utils.formatDate();
        datePicker.value = today;
        this.updateForDate(today);
      });
      
      yesterdayBtn.addEventListener('click', () => {
        const yesterday = Utils.getYesterday();
        datePicker.value = yesterday;
        this.updateForDate(yesterday);
      });
    },
    
    async update(data) {
      this.currentData = data;
      const datePicker = this.element?.querySelector('#stats-date-picker');
      const selectedDate = datePicker ? datePicker.value : Utils.formatDate();
      this.updateForDate(selectedDate);
      
      // Обновляем время последнего обновления
      if (this.element) {
        const now = new Date();
        this.element.querySelector('#last-update').textContent = 
          `Последнее обновление: ${now.toLocaleTimeString()}`;
      }
    },
    
    updateForDate(date) {
      if (!this.element) return;
      
      const stats = this.currentData[date] || { views: 0, whatsapp: 0 };
      
      // Обновление отображения
      this.element.querySelector('#views-count').textContent = stats.views;
      this.element.querySelector('#whatsapp-count').textContent = stats.whatsapp;
      
      // Форматирование даты для отображения
      const dateObj = new Date(date);
      let dateLabel = dateObj.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long' 
      });
      
      if (date === Utils.formatDate()) {
        dateLabel += ' (Сегодня)';
      } else if (date === Utils.getYesterday()) {
        dateLabel += ' (Вчера)';
      }
      
      this.element.querySelector('#date-stats').textContent = dateLabel;
    },
    
    show() {
      if (!this.element) {
        this.create();
        document.body.appendChild(this.element);
      }
      this.element.style.display = 'block';
      
      // Установка текущей даты
      const datePicker = this.element.querySelector('#stats-date-picker');
      datePicker.value = Utils.formatDate();
      
      // Первоначальное обновление
      this.update(this.currentData);
    },
    
    hide() {
      if (this.element) {
        this.element.style.display = 'none';
      }
    }
  };

  // Основной класс аналитики
  class GlobalAnalytics {
    constructor() {
      this.isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';
      this.init();
    }
    
    async init() {
      try {
        console.log('Инициализация аналитики...');
        
        // Установка токена (должен приходить из безопасного источника)
        this.setTokenFromSafeSource();
        
        // Отслеживаем просмотр
        const viewResult = await StatsManager.increment('views');
        console.log('Результат отслеживания просмотра:', viewResult);
        
        // Инициализируем UI если в режиме администратора
        if (this.isAdmin) {
          this.initAdminUI();
        }
        
        // Устанавливаем обработчики событий
        this.bindEventListeners();
        
      } catch (error) {
        console.error('Ошибка инициализации аналитики:', error);
      }
    }
    
    setTokenFromSafeSource() {
      // Здесь должен быть безопасный способ получения токена
      // Например, из data-атрибутов, защищенных переменных и т.д.
      // CONFIG.GITHUB_TOKEN = 'ваш_безопасный_токен';
    }
    
    initAdminUI() {
      StatsBadge.show();
      this.updateAdminUI();
      
      // Периодическое обновление
      this.updateInterval = setInterval(() => {
        this.updateAdminUI();
      }, CONFIG.UPDATE_INTERVAL);
    }
    
    async updateAdminUI() {
      try {
        const data = await StatsManager.get(true); // force update
        StatsBadge.update(data);
      } catch (error) {
        console.warn('Ошибка обновления UI:', error);
      }
    }
    
    bindEventListeners() {
      // Отслеживание кликов по WhatsApp ссылкам
      document.addEventListener('click', async (event) => {
        const link = event.target.closest('a');
        if (!link) return;
        
        const href = link.href.toLowerCase();
        if (href.includes('whatsapp') || href.includes('wa.me')) {
          console.log('Обнаружен клик по WhatsApp ссылке');
          
          // Сначала увеличиваем счетчик, потом открываем ссылку
          const result = await StatsManager.increment('whatsapp');
          console.log('Результат отслеживания WhatsApp:', result);
          
          // Не предотвращаем стандартное поведение, чтобы ссылка работала
          setTimeout(() => {
            window.open(link.href, '_blank');
          }, 100);
        }
      }, true);
    }
  }

  // Инициализация после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.GlobalAnalytics = new GlobalAnalytics();
    });
  } else {
    window.GlobalAnalytics = new GlobalAnalytics();
  }

  // Экспорт для глобального использования
  window.GlobalStats = {
    get: () => StatsManager.get(),
    track: (type) => StatsManager.increment(type),
    updateBadge: (data) => {
      if (new URLSearchParams(window.location.search).get('admin') === 'true') {
        StatsBadge.update(data);
      }
    },
    setToken: (token) => {
      CONFIG.GITHUB_TOKEN = token;
    }
  };

})();
