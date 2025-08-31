// analytics.js - система сбора статистики для сайта
(function() {
    'use strict';
    
    console.log('Analytics script loaded successfully!');
    
    // Проверка что скрипт загрузился
    if (typeof SITE_SETTINGS !== 'undefined') {
        console.log('SITE_SETTINGS found:', SITE_SETTINGS);
    } else {
        console.log('SITE_SETTINGS not found');
    }
    
    // Конфигурация
    const ANALYTICS_API = 'console'; // Только для тестирования!
    const SITE_ID = 'gadanie-privoroti.ru';
    
    // Функция для отправки данных
    async function sendEvent(eventType, eventData = {}) {
        try {
            const payload = {
                siteId: SITE_ID,
                eventType: eventType,
                eventData: eventData,
                url: window.location.href,
                referrer: document.referrer,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                screen: {
                    width: screen.width,
                    height: screen.height
                },
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            
            // Используем navigator.sendBeacon для надежной отправки
            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                navigator.sendBeacon(ANALYTICS_API, blob);
            } else {
                // Fallback для старых браузеров
                await fetch(ANALYTICS_API, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                    keepalive: true
                });
            }
            
            console.log('Analytics event sent:', eventType, eventData);
        } catch (error) {
            console.error('Analytics error:', error);
        }
    }
    
    // Функция для получения уникального ID посетителя
    function getVisitorId() {
        let visitorId = localStorage.getItem('visitor_id');
        if (!visitorId) {
            visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('visitor_id', visitorId);
        }
        return visitorId;
    }
    
    // Функция для получения session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('session_id', sessionId);
            
            // Отправляем событие начала сессии
            sendEvent('session_start', {
                sessionId: sessionId,
                visitorId: getVisitorId()
            });
        }
        return sessionId;
    }
    
    // Отслеживание кликов по WhatsApp
    function trackWhatsAppClicks() {
        const whatsappSelectors = [
            'a[href*="whatsapp"]',
            'a[href*="wa.me"]',
            '[class*="whatsapp"]',
            '[class*="wa-btn"]',
            '[onclick*="whatsapp"]',
            '#whatsapp-button',
            '.whatsapp-button'
        ];
        
        whatsappSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (!element.hasAttribute('data-analytics-tracked')) {
                    element.setAttribute('data-analytics-tracked', 'true');
                    element.addEventListener('click', function(e) {
                        const visitorId = getVisitorId();
                        const sessionId = getSessionId();
                        
                        sendEvent('whatsapp_click', {
                            text: this.textContent.trim(),
                            href: this.href,
                            elementType: this.tagName,
                            className: this.className,
                            visitorId: visitorId,
                            sessionId: sessionId
                        });
                    });
                }
            });
        });
    }
    
    // Отслеживание редиректов
    function trackRedirects() {
        if (typeof SITE_SETTINGS !== 'undefined' && SITE_SETTINGS.enableRedirect) {
            setTimeout(() => {
                const visitorId = getVisitorId();
                const sessionId = getSessionId();
                
                sendEvent('redirect_attempt', {
                    delay: SITE_SETTINGS.redirectDelaySeconds,
                    percentage: SITE_SETTINGS.redirectPercentage,
                    targetUrl: SITE_SETTINGS.siteUrl,
                    visitorId: visitorId,
                    sessionId: sessionId
                });
            }, SITE_SETTINGS.redirectDelaySeconds * 1000);
        }
    }
    
    // Отслеживание других кликов
    function trackOtherClicks() {
        document.addEventListener('click', function(e) {
            const target = e.target;
            
            // Пропускаем клики по WhatsApp
            if (target.closest('a[href*="whatsapp"]') || 
                target.closest('a[href*="wa.me"]') ||
                target.closest('[class*="whatsapp"]')) {
                return;
            }
            
            const visitorId = getVisitorId();
            const sessionId = getSessionId();
            
            // Отправляем событие клика
            sendEvent('click', {
                element: target.tagName,
                className: target.className,
                id: target.id,
                text: target.textContent ? target.textContent.trim().substring(0, 100) : '',
                href: target.href || '',
                visitorId: visitorId,
                sessionId: sessionId
            });
        }, true);
    }
    
    // Отслеживание времени на сайте
    function trackTimeSpent() {
        let startTime = Date.now();
        let maxScroll = 0;
        const visitorId = getVisitorId();
        const sessionId = getSessionId();
        
        // Отслеживание прокрутки
        window.addEventListener('scroll', function() {
            const currentScroll = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            if (currentScroll > maxScroll) {
                maxScroll = currentScroll;
                if ([25, 50, 75, 90, 100].includes(Math.round(maxScroll))) {
                    sendEvent('scroll', {
                        percentage: Math.round(maxScroll),
                        visitorId: visitorId,
                        sessionId: sessionId
                    });
                }
            }
        });
        
        // Отслеживание перед закрытием страницы
        window.addEventListener('beforeunload', function() {
            const timeSpent = Date.now() - startTime;
            sendEvent('session_end', {
                timeSpent: timeSpent,
                seconds: Math.round(timeSpent / 1000),
                maxScroll: Math.round(maxScroll),
                visitorId: visitorId,
                sessionId: sessionId
            });
        });
        
        // Периодическая отправка heartbeat
        setInterval(() => {
            sendEvent('heartbeat', {
                timeActive: Math.round((Date.now() - startTime) / 1000),
                visitorId: visitorId,
                sessionId: sessionId
            });
        }, 30000); // Каждые 30 секунд
    }
    
    // Инициализация всех трекеров
    function initTrackers() {
        trackWhatsAppClicks();
        trackRedirects();
        trackOtherClicks();
        trackTimeSpent();
        
        // Периодическая проверка новых элементов WhatsApp
        setInterval(trackWhatsAppClicks, 5000);
    }
    
    // Основная функция инициализации
    function initAnalytics() {
        // Получаем ID
        const visitorId = getVisitorId();
        const sessionId = getSessionId();
        
        console.log('Analytics initialized. Visitor:', visitorId, 'Session:', sessionId);
        
        // Отслеживание загрузки страницы
        window.addEventListener('load', function() {
            setTimeout(() => {
                const loadTime = performance.now();
                const pageTitle = document.title;
                
                sendEvent('pageview', {
                    title: pageTitle,
                    loadTime: loadTime,
                    visitorId: visitorId,
                    sessionId: sessionId,
                    isNewVisitor: !localStorage.getItem('returning_visitor')
                });
                
                // Помечаем как возвращающегося посетителя
                localStorage.setItem('returning_visitor', 'true');
            }, 1000);
        });
        
        // Запускаем трекеры
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initTrackers);
        } else {
            initTrackers();
        }
    }
    
    // Запускаем аналитику
    initAnalytics();
    
})();