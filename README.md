# crypto-live-ticker

A minimalist, real-time cryptocurrency price display for large screens and monitors.

> **Note:** This project is a personal playground for learning modern JavaScript/TypeScript, frameworks, and libraries. It is not production-ready, and parts of this README may be outdated due to ongoing work-in-progress changes and frequent refactoring. Trust Motivation and TODO. Usage and Installation are the last written setup and can lag.

## Motivation

This tool was created to monitor cryptocurrency prices in situations where a fullscreen ticker display is useful:
- **Daily Monitoring**: Keep an eye on crypto prices while working
- **Night Mode**: Display prices at night without the brightness keeping you awake - the ultra-dark theme lets you check prices while sleeping
- **Dedicated Display**: Perfect for a secondary monitor or digital display board

## TODO

- Add a control to switch between 24-hour and 12-hour time modes.
- Implement lock as a component.
- Allow hiding controls or changing the top menu style.
- Auto-resize according to media queries.
- Add JSDoc outside BinanceClient.
- Add zoom controls.
- Wire the decimal control to BinanceClient.maxDecimals. The control still clamps 0-8.
- Review CSS structure to clarify which definitions belong to the component vs. the app.
- Use WebSocket in the Binance client.
- Store symbol, decimals, and interval in local storage. Theme is already stored as `ui.theme`.
- Fix query args: if an arg is available, change it without reload and keep history in sync with internal state. Manual query arg changes should trigger state updates. If query args change from internal state updates, avoid cyclic re-renders.
- Fix the interval timer: the query value is multiplied by 1000 twice, and the timer does not restart when params arrive.
- Remove geolocation; use the browser time zone instead (privacy browsers may return an incorrect one).
- Allow manual time zone changes in settings.
- Add a settings panel for more advanced options.
- Binance client
  - Allow rebuilding the index at intervals.
  - Allow subscribing to index rebuilds.

## Features

- **Live Price** - Binance spot price for the selected pair
- **Large Display** - Big type for a monitor or fullscreen view
- **Symbol and Icon** - Pick a pair; the coin icon sits next to the name
- **Decimals** - Change how many decimal places the price shows
- **Light and Dark** - Switch theme from the toolbar
- **Clock** - Current time on the display
- **Title and Favicon** - The tab title follows the price, the icon follows the coin
- **Client-Side** - Runs in the browser, no API key and no backend

## Usage

**Quick Start**: Install dependencies, then start the dev server. Open the URL Vite prints.

```
npm install
npm run dev
```

### Query Parameters

Customize the ticker using URL parameters:

```
index.html?symbol=BTCUSDT&interval=3&decimals=2&theme=dark
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `symbol` | `BTCUSDT` | Trading pair symbol (e.g., `ETHUSDT`, `BNBUSDT`) |
| `interval` | `3` | Update interval in seconds |
| `decimals` | `0` | Number of decimal places to display |
| `theme` | - | Theme: `light` or `dark` |

The `interval` row is the intended meaning. The timer still starts at 1 second and does not follow this value yet.

### Examples

**Single Parameter:**
- `index.html?symbol=BTCUSDT` - Bitcoin price
- `index.html?interval=5` - Update every 5 seconds
- `index.html?decimals=2` - Show 2 decimal places
- `index.html?theme=dark` - Dark theme

**Parameter Combinations:**
- `index.html?symbol=BTCUSDT&decimals=2` - Bitcoin with 2 decimals
- `index.html?symbol=ETHUSDT&interval=5` - Ethereum, 5-second updates
- `index.html?symbol=BNBUSDT&decimals=4&interval=10` - Binance Coin with 4 decimals, 10-second updates
- `index.html?symbol=BTCUSDT&theme=dark` - Bitcoin in the dark theme
- `index.html?symbol=ETHUSDT&decimals=2&interval=3&theme=dark` - Ethereum, 2 decimals, 3-second updates, dark theme
- `index.html?symbol=ADAUSDT&interval=5&decimals=6` - Cardano with high precision

## Installation

1. Clone or download this repository
2. Install and start: `npm install`, then `npm run dev`
3. **Logo Images**: Pair icons are PNG files in `public/symbols/`:
   - Name files: `{symbol}.png` (lowercase, e.g., `btcusdt.png`, `ethusdt.png`)
   - The dev server reads this folder into the symbol list
   - To add a pair, drop its PNG there and restart the dev server
   - **Note**: Later, images will come directly from the Binance CDN (`https://bin.bnbstatic.com/static/assets/logos/`).

## Data Source

**Price Data**: [Binance Public API v3](https://developers.binance.com/docs/binance-spot-api-docs/rest-api)
- All trading pairs listed on Binance Spot are supported
- No API key required
- Real-time prices updated via `GET /api/v3/ticker/price`
- Symbol catalog comes from `GET /api/v3/exchangeInfo` (spot, trading). The page price still uses `ticker/price`.

**Logo Images**: Must be provided separately
- Common cryptocurrencies (BTC, ETH, BNB, etc.) are easy to find
- For less common tokens, check:
  - [CoinGecko Assets](https://www.coingecko.com/)
  - [CoinMarketCap](https://coinmarketcap.com/)
  - Official project repositories
