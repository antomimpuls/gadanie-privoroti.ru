// analytics.js - глобальный счётчик статистики
(function() {
  'use strict';

  // Конфигурация
  const CONFIG = {
    GITHUB_TOKEN: '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',
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
    getDaysAgo: (days) => Utils.formatDate(Utils.addDays(new Date(), -days))
  };

  // Работа с GitHub
  const GitHubService = {
    getRawUrl() {
      return `https://raw.githubusercontent.com/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/main/${CONFIG.FILE_PATH}`;
    },
    
    getApiUrl() {
      return `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`;
    },
    
    async getFile() {
      try {
        const response = await fetch(this.getRawUrl());
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        console.warn('Failed to fetch stats:', error);
        return {};
      }
    },
    
    async getFileSha() {
      try {
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
        const sha = await this.getFileSha();
        const encodedContent = btoa(JSON.stringify(content, null, 2));
        
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
        
        return response.ok;
      } catch (error) {
        console.error('Failed to update file:', error);
        return false;
      }
    }
  };

  // Статистика
  const StatsManager = {
    async get() {
      try {
        return await GitHubService.getFile();
      } catch {
        return {};
      }
    },
    
    async save(data) {
      try {
        return await GitHubService.updateFile(data);
      } catch {
        return false;
      }
    },
    
    async increment(type) {
      const today = Utils.formatDate();
      const data = await this.get();
      
      if (!data[today]) {
        data[today] = { views: 0, whatsapp: 0 };
      }
      
      data[today][type] = (data[today][type] || 0) + 1;
      
      return this.save(data);
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
      const datePicker = this.element.querySelector('#stats-date-picker');
      const selectedDate = datePicker.value || Utils.formatDate();
      this.updateForDate(selectedDate);
    },
    
    updateForDate(date) {
      if (!this.element) return;
      
      const stats = this.currentData[date] || { views: 0, whatsapp: 0 };
      const dateDisplay = this.element.querySelector('#date-stats');
      
      // Форматирование даты для отображения
      const dateObj = new Date(date);
      const today = new Date();
      const yesterday = Utils.addDays(today, -1);
      
      let dateLabel = dateObj.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long' 
      });
      
      if (date === Utils.formatDate()) {
        dateLabel += ' (Сегодня)';
      } else if (date === Utils.getYesterday()) {
        dateLabel += ' (Вчера)';
      }
      
      // Обновление отображения
      this.element.querySelector('#views-count').textContent = stats.views;
      this.element.querySelector('#whatsapp-count').textContent = stats.whatsapp;
      dateDisplay.textContent = dateLabel;
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
        // Отслеживаем просмотр
        await StatsManager.increment('views');
        
        // Инициализируем UI если в режиме администратора
        if (this.isAdmin) {
          this.initAdminUI();
        }
        
        // Устанавливаем обработчики событий
        this.bindEventListeners();
        
      } catch (error) {
        console.error('Analytics initialization failed:', error);
      }
    }
    
    initAdminUI() {
      StatsBadge.show();
      this.updateAdminUI();
      
      // Периодическое обновление
      setInterval(() => {
        this.updateAdminUI();
      }, CONFIG.UPDATE_INTERVAL);
    }
    
    async updateAdminUI() {
      try {
        const data = await StatsManager.get();
        StatsBadge.update(data);
      } catch (error) {
        console.warn('Failed to update admin UI:', error);
      }
    }
    
    bindEventListeners() {
      // Отслеживание кликов по WhatsApp ссылкам
      document.addEventListener('click', async (event) => {
        const link = event.target.closest('a');
        if (!link) return;
        
        const href = link.href.toLowerCase();
        if (href.includes('whatsapp') || href.includes('wa.me')) {
          event.preventDefault();
          await StatsManager.increment('whatsapp');
          window.open(link.href, '_blank');
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
    }
  };

})();
