# crypto-live-ticker

A minimalist, real-time cryptocurrency price display for large screens and monitors.

> **Note:** This project is a personal playground for learning modern JavaScript/TypeScript, frameworks, and libraries. It is not production-ready, and parts of this README may be outdated due to ongoing work-in-progress changes and frequent refactoring.

## Motivation

This tool was created to monitor cryptocurrency prices in situations where a fullscreen ticker display is useful:
- **Daily Monitoring**: Keep an eye on crypto prices while working
- **Night Mode**: Display prices at night without the brightness keeping you awake - the Sleep theme keeps the screen black and the text very dim
- **Dedicated Display**: Perfect for a secondary monitor or digital display board

## TODO

- Initialize UI render states as early as possible to prevent flicker effects.
- Fix query arguments.
- Create a Svelte module for the title and icon.
- If no localStorage theme is set, use the browser theme.
- Fix the interval timer: the query value is multiplied by 1000 twice, and the timer does not restart when params arrive.
- Fix query args: if an arg is available, change it without reload and keep history in sync with internal state. Manual query arg changes should trigger state updates. If query args change from internal state updates, avoid cyclic re-renders.
- Wire the decimal control to BinanceClient.maxDecimals. The control still clamps 0-8.
- Add zoom controls.
- Store symbol, decimals, and interval in local storage. Theme is already stored as `ui.theme`.
- Add a control to switch between 24-hour and 12-hour time modes.
- Auto-resize according to media queries.
- Allow hiding controls or changing the top menu style.
- Implement lock as a component.
- Add a settings panel for more advanced options.
- Allow manual time zone changes in settings.
- use vite ev for setup
- Set up valid decimal ranges from the Binance client response regarding each asset's tick size.
- Review CSS structure to clarify which definitions belong to the component vs. the app.
- Binance client
  - Allow rebuilding the index at intervals.
  - Allow subscribing to index rebuilds.
- Use WebSocket in the Binance client.
- Add JSDoc outside BinanceClient.
- Use app2 kind of store style

## Features

- **Live Price Updates** - Fetches real-time cryptocurrency prices from Binance API
- **Fullscreen Display** - Optimized for large displays with responsive typography
- **Customizable Ticker** - Support for any trading pair on Binance (BTC, ETH, etc.)
- **Adjustable Update Interval** - Configure refresh rate via query parameters
- **Themes** - Light, dark, Sleep, a NeoVim-like TUI, and early-web 90's HTML via the `theme` query parameter
- **Minimal Design** - Clean, distraction-free interface
- **Live Clock** - Displays current time alongside price
- **Dynamic Favicon & Title** - Updates with current price
- **Fully Client-Side** - Runs entirely in your browser, no server needed
- **Works Anywhere** - Compatible with all modern browsers (Chrome, Firefox, Safari, Edge)

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
| `theme` | - | Theme id: `light`, `dark`, `sleep`, `tui`, or `html` |

### Examples

**Single Parameter:**
- `index.html?symbol=BTCUSDT` - Bitcoin price
- `index.html?interval=5` - Update every 5 seconds
- `index.html?decimals=2` - Show 2 decimal places
- `index.html?theme=dark` - Dark theme
- `index.html?theme=sleep` - Sleep theme, dim text on black
- `index.html?theme=tui` - NeoVim-like TUI theme
- `index.html?theme=html` - Early-web 90's HTML theme

**Parameter Combinations:**
- `index.html?symbol=BTCUSDT&decimals=2` - Bitcoin with 2 decimals
- `index.html?symbol=ETHUSDT&interval=5` - Ethereum, 5-second updates
- `index.html?symbol=BNBUSDT&decimals=4&interval=10` - Binance Coin with 4 decimals, 10-second updates
- `index.html?symbol=BTCUSDT&theme=dark` - Bitcoin in the dark theme
- `index.html?symbol=ETHUSDT&decimals=2&interval=3&theme=tui` - Ethereum, 2 decimals, 3-second updates, TUI theme
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
