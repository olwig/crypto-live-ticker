# crypto-live-ticker

A minimalist, real-time cryptocurrency price display for large screens and monitors.

## Motivation

This tool was created to monitor cryptocurrency prices in situations where a fullscreen ticker display is useful:
- **Daily Monitoring**: Keep an eye on crypto prices while working
- **Night Mode**: Display prices at night without the brightness keeping you awake - the ultra-dark theme lets you check prices while sleeping
- **Dedicated Display**: Perfect for a secondary monitor or digital display board

## Features

- **Live Price Updates** - Fetches real-time cryptocurrency prices from Binance API
- **Fullscreen Display** - Optimized for large displays with responsive typography
- **Customizable Ticker** - Support for any trading pair on Binance (BTC, ETH, etc.)
- **Adjustable Update Interval** - Configure refresh rate via query parameters
- **Dark & Night Modes** - Light and ultra-dark display modes
- **Minimal Design** - Clean, distraction-free interface
- **Live Clock** - Displays current time alongside price
- **Dynamic Favicon & Title** - Updates with current price
- **Fully Client-Side** - Runs entirely in your browser, no server needed
- **Works Anywhere** - Compatible with all modern browsers (Chrome, Firefox, Safari, Edge)

## Usage

**Quick Start**: Simply **double-click `index.html`** to open it in your default browser. No server or localhost setup required!

### Query Parameters

Customize the ticker using URL parameters:

```
index.html?symbol=BTCUSDT&interval=3&decimals=2&night
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `symbol` | `BTCUSDT` | Trading pair symbol (e.g., `ETHUSDT`, `BNBUSDT`) |
| `interval` | `3` | Update interval in seconds |
| `decimals` | `0` | Number of decimal places to display |
| `night` | - | Enable night mode (ultra-dark theme) |

### Examples

**Single Parameter:**
- `index.html?symbol=BTCUSDT` - Bitcoin price
- `index.html?interval=5` - Update every 5 seconds
- `index.html?decimals=2` - Show 2 decimal places
- `index.html?night` - Enable night mode

**Parameter Combinations:**
- `index.html?symbol=BTCUSDT&decimals=2` - Bitcoin with 2 decimals
- `index.html?symbol=ETHUSDT&interval=5` - Ethereum, 5-second updates
- `index.html?symbol=BNBUSDT&decimals=4&interval=10` - Binance Coin with 4 decimals, 10-second updates
- `index.html?symbol=BTCUSDT&night` - Bitcoin in night mode
- `index.html?symbol=ETHUSDT&decimals=2&interval=3&night` - Ethereum, 2 decimals, 3-second updates, night mode
- `index.html?symbol=ADAUSDT&interval=5&decimals=6` - Cardano with high precision

## Installation

1. Clone or download this repository
2. **Logo Images**: Provide cryptocurrency logo images as PNG files in the `assets/` folder:
   - Create an `assets/` folder (already included in the repository)
   - Name files: `{symbol}.png` (lowercase, e.g., `btcusdt.png`, `ethusdt.png`)
   - Place them in the `assets/` directory
   - **Note**: Not all trading pairs have logos available - you'll need to source and add the images manually
3. Open `index.html` in a browser or deploy to a web server

## Data Source

**Price Data**: [Binance Public API v3](https://binance-docs.github.io/apidocs/)
- All trading pairs listed on Binance Spot are supported
- No API key required
- Real-time prices updated via `GET /api/v3/ticker/price`

**Logo Images**: Must be provided separately
- Common cryptocurrencies (BTC, ETH, BNB, etc.) are easy to find
- For less common tokens, check:
  - [CoinGecko Assets](https://www.coingecko.com/)
  - [CoinMarketCap](https://coinmarketcap.com/)
  - Official project repositories

## License

MIT

---

**Note**: This project uses the Binance public API and does not require authentication. Logo images should be provided separately.
