
interface AnalyticsConfig {
    endpoint: string;
    batchInterval: number;
    maxBatchSize: number;
}

interface AnalyticsEvent {
    timestamp: string;
    sessionId: string;
    eventType: string;
    eventName: string;
    pagePath: string;
    referrer: string;
    device: string;
    screenRes: string;
    metadata: Record<string, any>;
}

const CONFIG: AnalyticsConfig = {
    // REPLACE THIS WITH YOUR DEPLOYED GOOGLE APPS SCRIPT URL
    endpoint: import.meta.env.VITE_ANALYTICS_URL || '',
    batchInterval: 15000, // 15 seconds
    maxBatchSize: 50
};

let eventBuffer: AnalyticsEvent[] = [];

// 1. Session Management
const getSessionId = (): string => {
    let sessionId = localStorage.getItem('sa_session_id');
    if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('sa_session_id', sessionId);
    }
    return sessionId;
};

// 2. Core Tracking Logic
export const trackEvent = (type: string, name: string, metadata: Record<string, any> = {}) => {
    if (!CONFIG.endpoint) {
        console.warn('Analytics endpoint not configured. Event dropped:', name);
        return;
    }

    const event: AnalyticsEvent = {
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        eventType: type,
        eventName: name,
        pagePath: window.location.pathname,
        referrer: document.referrer || 'direct',
        device: navigator.userAgent.includes(') ') ? navigator.userAgent.split(') ')[0].split(' (')[1] : 'Unknown',
        screenRes: `${window.screen.width}x${window.screen.height}`,
        metadata: metadata
    };

    eventBuffer.push(event);

    // Immediate send if buffer is too large
    if (eventBuffer.length >= CONFIG.maxBatchSize) {
        flush();
    }
};

// 3. Batch Sending (The Optimizer)
export const flush = async () => {
    if (eventBuffer.length === 0 || !CONFIG.endpoint) return;

    const payload = [...eventBuffer];
    eventBuffer = []; // Clear buffer immediately to prevent duplicates

    try {
        await fetch(CONFIG.endpoint, {
            method: 'POST',
            mode: 'no-cors', // GAS requires 'no-cors' for simple POST or handled via Redirects
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        eventBuffer = [...payload, ...eventBuffer]; // Simple retry: put back in buffer
        console.warn('Analytics sync failed, retrying later...');
    }
};

// 4. Initialize Auto-Trackers
export const initAnalytics = () => {
    if (typeof window === 'undefined') return;

    // Page View on load
    trackEvent('page_view', 'load');

    // Button Clicks
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const btn = target.closest('button, a.btn, .track-click');
        if (btn) {
            trackEvent('click', btn.id || (btn as HTMLElement).innerText.trim() || 'unnamed_element', {
                text: (btn as HTMLElement).innerText.substring(0, 30).trim(),
                tag: btn.tagName
            });
        }
    });

    // 5. Lifecycle Management
    setInterval(flush, CONFIG.batchInterval);
    window.addEventListener('beforeunload', flush); // Final flush on exit

    // Global Access (optional)
    (window as any).Analytics = { track: trackEvent, flush };
};
