export const app = $state({
    symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT'],
    symbol: 'BTCUSDT',
    interval: 1,
    price: 0.0,
    decimals: 0,
    clock: new Date(),
    locale: 'en-US',
    timezone: 'UTC',    
    hour12: false, 
});

export const app2 = {
    get symbol() { return app.symbol; },
    set symbol(value) { app.symbol = value; },

    get interval() { return app.interval; },
    set interval(value) { app.interval = value; },

    get clock() { return app.clock; },
    set clock(value) { app.clock = value; },

    get price() { return app.price; },
    set price(value) { app.price = value; },

    get decimals() { return app.decimals; },
    set decimals(value) { app.decimals = value; },

    get locale() { return app.locale; },
    set locale(value) { app.locale = value; },

    get timezone() { return app.timezone; },
    set timezone(value) { app.timezone = value; }
};

// TODO allow external subscribers to move query string modifications outside of the UI logic
// TODO update language and currency based on user preferences