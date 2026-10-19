
import './app.css'
import { mount } from 'svelte'
import App from './App.svelte'
import { app as store } from './lib/store.svelte.js'
import './lib/dom.svelte.js'
import tzlookup from 'tz-lookup'
import { symbolIndex } from './lib/symbolIndex.js'
import { themeManager as theme } from './lib/theme-manager.svelte.js'

const app = mount(App, {
  target: document.getElementById('app'),
})


function updateLocaleState() {
  store.locale = navigator.language;
  console.log('Locale updated to:', store.locale);
}

function updateTimezoneState() {
  // TODO neo geo, ust use browsers timezone, if using librwolf with block it its the clients fault
  navigator.geolocation.getCurrentPosition(pos => {
    const tz = tzlookup(pos.coords.latitude, pos.coords.longitude);
    
    store.timezone = tz;

    console.log('Timezone from geolocation:', tz);
  });
}

function setupAssets() {
  // TODO create asset in dem via vite plugin
  // TODO make map from its ...

  console.log('Asset index loaded with', symbolIndex.list().length, 'symbols.');
  store.symbols = symbolIndex.list();
}

function setupTheme() {
  // TODO load theme from local storage or default
  const currentTheme = theme.get();
  console.log('Initial theme loaded:', currentTheme);
  theme.set(currentTheme);
}



function main() {
  // TODO fix initial state which first load btc then waits for api to render new symbol. render instant mit all correct but -1 value
  // TODO subscribe to store changes and update query string in address bar without reloading page
  // TODO them swicting via data-theme and css variables, not via class on body
  // TODO store theme state and others to local storage and load on startup
  // TODO dist + deploy on gh pages
  // TODO move binance logic to extra module
  // TODO use ccxt
  // TODO biannjcy module shoudl also creaet symbol img links to its cdn

  setupTheme();

  setupAssets();

  // get timezone formst not from browser, but from the internet ip location
  updateTimezoneState();

  // subscribe to language change in browser
  // set initial locale based on browser settings
  updateLocaleState();
  window.addEventListener('languagechange', updateLocaleState);
}

main();


// return price as float or false if invalid symbol or call not ok
async function fetchPriceData(symbol) {

  // TODO check if symbol correct and return false if not
  // TODO check if symbol asset available, load from cdn
  if (!symbol || typeof symbol !== 'string') {
    return false;
  }

  const url =`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
  if (!url) {
    console.error('Invalid symbol provided in query parameters.');
    return false;
  }

  try {
    const response = await fetch(url);
    if (!response.ok || response.status !== 200) {
      console.error('Invalid symbol provided in query parameters.');
      return false;
    }

    const data = await response.json();
    return parseFloat(data.price);

  } catch (error) {
    console.error('Error fetching price data:', error);
    return false;
  }
}

 // fetch initial price 
setInterval((() => {
    const fetch = () => {
      fetchPriceData(store.symbol).then(price => {
        if (price !== false) {
          store.price = price;
        } else {
          store.price = -1.0;
          store.symbol = 'ERR';
        }
      });
    };

    fetch(); // initial fetch
    return fetch;
})(), store.interval * 1000);

async function ensureParams() {
    // TODO rewrite address params with normed args without reloading

    const params = new URLSearchParams(window.location.search);
    
    const symbol = (params.get('symbol') || 'BTCUSDT').toUpperCase();
    const interval = parseInt(params.get('interval') || '3') * 1000;
    const decimals = parseInt(params.get('decimals') || '0');
    const themeName = params.has('theme')
        ? String(params.get('theme')).trim().toLowerCase()
        : '';

    // TODO use functiuon for it with not return price and symbol if not valid
    // TODO check if symbol is valid and available on binance
    const fetched = await fetchPriceData(symbol);
    if(fetched === false) {
        console.error('Invalid symbol provided in query parameters.');
        throw new Error('Forced crash: invalid symbol provided in query parameters.');
    }

    return {
        symbol,
        interval,
        decimals,
        theme: themeName
    };
}

ensureParams().then(params => {
    store.symbol = params.symbol;
    store.interval = params.interval;
    store.decimals = params.decimals;
    if (params.theme && theme.has(params.theme)) {
        theme.set(params.theme);
    }
}).catch(error => {
    console.error('Error ensuring parameters:', error);
    // TODO show error message to user
});

export default app
