// binance prices api client

// TODO websocket mode to subscribe to price updates

const ICON_CDN = 'https://bin.bnbstatic.com/static/assets/logos/';
const PING_URL = 'https://api.binance.com/api/v3/ping';
const EXCHANGE_INFO_URL = 'https://api.binance.com/api/v3/exchangeInfo?permissions=SPOT&symbolStatus=TRADING&showPermissionSets=false';

/**
 * Base-asset catalog: quotes, pairs, and icon URL.
 * @typedef {Record<string, {
 *   quotes: string[],
 *   pairs: Record<string, {
 *     symbol: string,
 *     status: string,
 *     baseAssetPrecision: number,
 *     quoteAssetPrecision: number,
 *     tickSize: string|null
 *   }>,
 *   image: string
 * }>} BinanceIndex
 */

function tickSizeOf(filters) {
    if (!Array.isArray(filters)) return null;

    for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        if (filter.filterType === 'PRICE_FILTER') return filter.tickSize;
    }

    return null;
}

function decimalsOf(tickSize) {
    if (tickSize == null) return null;

    const text = String(tickSize);
    if (!/^\d+(\.\d+)?$/.test(text)) return null;
    if (Number(text) <= 0) return null;

    const dot = text.indexOf('.');
    if (dot === -1) return 0;

    return text.slice(dot + 1).replace(/0+$/, '').length;
}

function orderQuotes(entry) {
    const quotes = Object.keys(entry.pairs).sort();
    const pairs = {};
    for (let i = 0; i < quotes.length; i++) {
        const quote = quotes[i];
        pairs[quote] = entry.pairs[quote];
    }
    return { quotes, pairs, image: entry.image };
}

async function readJson(url, name) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Binance ${name} failed: ${response.status}`);
    }
    return response.json();
}

/** Public Binance spot client. Builds a base-asset catalog. No API key. */
export class BinanceClient {

    /**
     * Base asset → quotes, pairs, and icon. Empty until {@link buildIndex}.
     * @type {BinanceIndex}
     */
    #index;

    /**
     * Pair code → base and quote. Built with {@link buildIndex}.
     * @type {Record<string, { base: string, quote: string }>}
     */
    #bySymbol;

    /** Creates a client with an empty catalog. */
    constructor() {
        this.#index = {};
        this.#bySymbol = {};
    }

    /**
     * Current base-asset catalog.
     * @returns {BinanceIndex}
     */
    get index() {
        return this.#index;
    }

    /**
     * Lightweight connectivity check against the public spot API.
     * @returns {Promise<object>} Empty JSON body.
     * @throws {Error} When the response status is not ok.
     */
    async ping() {
        return readJson(PING_URL, 'ping');
    }

    /**
     * Base asset → quote currencies, from the public spot exchangeInfo catalog.
     * @returns {Promise<void>}
     * @throws {Error} When the response status is not ok.
     */
    async buildIndex() {
        const data = await readJson(EXCHANGE_INFO_URL, 'exchangeInfo');
        const index = {};
        const bySymbol = {};

        for (const row of data.symbols) {
            if (!row.isSpotTradingAllowed) continue;

            const base = String(row.baseAsset).toUpperCase();
            const quote = String(row.quoteAsset).toUpperCase();
            let entry = index[base];
            if (!entry) {
                entry = index[base] = {
                    pairs: {},
                    image: `${ICON_CDN}${encodeURIComponent(base)}.png`,
                };
            }

            const symbol = String(row.symbol).toUpperCase();
            entry.pairs[quote] = {
                symbol,
                status: row.status,
                baseAssetPrecision: row.baseAssetPrecision,
                quoteAssetPrecision: row.quoteAssetPrecision,
                tickSize: tickSizeOf(row.filters),
            };
            bySymbol[symbol] = { base, quote };
        }

        for (const base of Object.keys(index)) {
            index[base] = orderQuotes(index[base]);
        }

        this.#index = index;
        this.#bySymbol = bySymbol;
    }

    /**
     * Decimal places that match the pair's price step. Trailing zeros in tickSize do not count.
     * @param {string} symbol Base asset plus quote, e.g. BTCUSDT.
     * @returns {number|null} Null when the pair or the price step is missing.
     */
    maxDecimals(symbol) {
        const ref = this.#bySymbol[String(symbol).toUpperCase()];
        if (!ref) return null;
        return decimalsOf(this.#index[ref.base].pairs[ref.quote].tickSize);
    }
}

export const binance = new BinanceClient();
