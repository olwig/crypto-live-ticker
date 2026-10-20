export const app = $state({
    symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT'],
    symbol: 'BTCUSDT',
    interval: 1,
    price: 0.0,
    decimals: 0,
    locale: 'en-US',
    timezone: 'UTC',    
    hour12: false, 
});

export const app2 = {
    get symbol() { return app.symbol; },
    set symbol(value) { app.symbol = value; },

    get interval() { return app.interval; },
    set interval(value) { app.interval = value; },

    get price() { return app.price; },
    set price(value) { app.price = value; },

    get decimals() { return app.decimals; },
    set decimals(value) { app.decimals = value; },

    get locale() { return app.locale; },
    set locale(value) { app.locale = value; },

    get timezone() { return app.timezone; },
    set timezone(value) { app.timezone = value; }
};

export function syncLocale() {
    app.locale = navigator.language;
    console.log('Locale updated to:', app.locale);
}

export function syncTimezone() {
    app.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('Timezone from browser:', app.timezone);
}

// languagechange is the locale event. timezonechange is the zone event where the browser sends it.
export function watchLocaleChanges(target = globalThis) {
    target.addEventListener('languagechange', syncLocale);
    target.addEventListener('timezonechange', syncTimezone);
    return () => {
        target.removeEventListener('languagechange', syncLocale);
        target.removeEventListener('timezonechange', syncTimezone);
    };
}

// TODO allow external subscribers to move query string modifications outside of the UI logic
// TODO update language and currency based on user preferences
