import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { BinanceClient, binance } from '../src/lib/binance.js';

const originalFetch = globalThis.fetch;
const PING_URL = 'https://api.binance.com/api/v3/ping';
const EXCHANGE_INFO_URL = 'https://api.binance.com/api/v3/exchangeInfo?permissions=SPOT&symbolStatus=TRADING&showPermissionSets=false';
const ICON_CDN = 'https://bin.bnbstatic.com/static/assets/logos/';

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function stubFetch(handler) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return handler(url, init);
  };
  return calls;
}

function spot(partial) {
  return {
    status: 'TRADING',
    baseAssetPrecision: 8,
    quoteAssetPrecision: 8,
    isSpotTradingAllowed: true,
    filters: [],
    ...partial,
  };
}

test('ping requests the binance ping endpoint and returns the body', async () => {
  const calls = stubFetch(async () => ({
    ok: true,
    status: 200,
    json: async () => ({}),
  }));

  const body = await new BinanceClient().ping();

  assert.deepEqual(body, {});
  assert.deepEqual(calls.map((call) => call.url), [PING_URL]);
});

test('ping throws when the response is not ok', async () => {
  stubFetch(async () => ({
    ok: false,
    status: 418,
    json: async () => {
      throw new Error('body should not be read');
    },
  }));

  await assert.rejects(
    () => new BinanceClient().ping(),
    (err) => {
      assert.ok(err instanceof Error);
      assert.match(err.message, /Binance ping failed: 418/);
      return true;
    },
  );
});

test('ping rejects when fetch rejects', async () => {
  stubFetch(async () => {
    throw new Error('network down');
  });

  await assert.rejects(() => new BinanceClient().ping(), /network down/);
});

test('index starts empty', () => {
  assert.deepEqual(new BinanceClient().index, {});
});

test('exported binance is a BinanceClient', () => {
  assert.ok(binance instanceof BinanceClient);
});

test('buildIndex groups spot quotes under the base asset', async () => {
  const calls = stubFetch(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      symbols: [
        spot({
          symbol: 'ETHUSDT',
          baseAsset: 'ETH',
          quoteAsset: 'USDT',
          filters: [{ filterType: 'PRICE_FILTER', tickSize: '0.01000000' }],
        }),
        spot({
          symbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          filters: [{ filterType: 'LOT_SIZE' }, { filterType: 'PRICE_FILTER', tickSize: '0.01000000' }],
        }),
        spot({
          symbol: 'btceur',
          baseAsset: 'btc',
          quoteAsset: 'eur',
          quoteAssetPrecision: 2,
          filters: [{ filterType: 'PRICE_FILTER', tickSize: '0.01' }],
        }),
        spot({
          symbol: 'SOLBTC',
          baseAsset: 'SOL',
          quoteAsset: 'BTC',
          isSpotTradingAllowed: false,
        }),
      ],
    }),
  }));

  const client = new BinanceClient();
  await client.buildIndex();
  const index = client.index;

  assert.deepEqual(calls.map((call) => call.url), [EXCHANGE_INFO_URL]);
  assert.deepEqual(Object.keys(index), ['ETH', 'BTC']);
  assert.equal(index.SOL, undefined);
  assert.deepEqual(index.BTC.quotes, ['EUR', 'USDT']);
  assert.deepEqual(Object.keys(index.BTC.pairs), ['EUR', 'USDT']);
  assert.deepEqual(Object.keys(index.BTC), ['quotes', 'pairs', 'image']);
  assert.deepEqual(index.BTC.pairs.EUR, {
    symbol: 'BTCEUR',
    status: 'TRADING',
    baseAssetPrecision: 8,
    quoteAssetPrecision: 2,
    tickSize: '0.01',
  });
  assert.equal(index.BTC.pairs.USDT.tickSize, '0.01000000');
  assert.equal(index.BTC.image, `${ICON_CDN}BTC.png`);
  assert.equal(index.ETH.image, `${ICON_CDN}ETH.png`);
});

test('buildIndex keeps the last row when a quote is repeated', async () => {
  stubFetch(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      symbols: [
        spot({
          symbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          filters: [{ filterType: 'PRICE_FILTER', tickSize: '0.01' }],
        }),
        spot({
          symbol: 'btcusdt',
          baseAsset: 'btc',
          quoteAsset: 'usdt',
          quoteAssetPrecision: 2,
          filters: [{ filterType: 'PRICE_FILTER', tickSize: '0.01000000' }],
        }),
      ],
    }),
  }));

  const client = new BinanceClient();
  await client.buildIndex();

  assert.deepEqual(client.index.BTC.quotes, ['USDT']);
  assert.deepEqual(client.index.BTC.pairs.USDT, {
    symbol: 'BTCUSDT',
    status: 'TRADING',
    baseAssetPrecision: 8,
    quoteAssetPrecision: 2,
    tickSize: '0.01000000',
  });
});

test('buildIndex uses null tickSize when no price filter is present', async () => {
  stubFetch(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      symbols: [
        spot({
          symbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          filters: undefined,
        }),
        spot({
          symbol: 'BTCEUR',
          baseAsset: 'BTC',
          quoteAsset: 'EUR',
          filters: [{ filterType: 'LOT_SIZE', tickSize: '1' }],
        }),
      ],
    }),
  }));

  const client = new BinanceClient();
  await client.buildIndex();

  assert.equal(client.index.BTC.pairs.USDT.tickSize, null);
  assert.equal(client.index.BTC.pairs.EUR.tickSize, null);
});

test('buildIndex throws when the response is not ok and keeps the previous index', async () => {
  let call = 0;
  stubFetch(async () => {
    call += 1;
    if (call === 1) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          symbols: [
            spot({
              symbol: 'BTCUSDT',
              baseAsset: 'BTC',
              quoteAsset: 'USDT',
            }),
          ],
        }),
      };
    }
    return {
      ok: false,
      status: 418,
      json: async () => {
        throw new Error('body should not be read');
      },
    };
  });

  const client = new BinanceClient();
  await client.buildIndex();
  const index = client.index;

  await assert.rejects(
    () => client.buildIndex(),
    (err) => {
      assert.ok(err instanceof Error);
      assert.match(err.message, /Binance exchangeInfo failed: 418/);
      return true;
    },
  );

  assert.equal(client.index, index);
  assert.deepEqual(index.BTC.quotes, ['USDT']);
});

test('maxDecimals counts tick places and ignores trailing zeros', async () => {
  stubFetch(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      symbols: [
        spot({
          symbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          filters: [{ filterType: 'PRICE_FILTER', tickSize: '0.01000000' }],
        }),
        spot({
          symbol: 'BTCEUR',
          baseAsset: 'BTC',
          quoteAsset: 'EUR',
          filters: [{ filterType: 'PRICE_FILTER', tickSize: '0.01' }],
        }),
        spot({
          symbol: 'SHIBUSDT',
          baseAsset: 'SHIB',
          quoteAsset: 'USDT',
          filters: [{ filterType: 'PRICE_FILTER', tickSize: '0.00000100' }],
        }),
        spot({
          symbol: 'ETHBTC',
          baseAsset: 'ETH',
          quoteAsset: 'BTC',
          filters: [{ filterType: 'PRICE_FILTER', tickSize: '1.00000000' }],
        }),
        spot({
          symbol: 'DOGEUSDT',
          baseAsset: 'DOGE',
          quoteAsset: 'USDT',
          filters: [{ filterType: 'PRICE_FILTER', tickSize: '10' }],
        }),
        spot({
          symbol: 'SOLUSDT',
          baseAsset: 'SOL',
          quoteAsset: 'USDT',
          filters: [],
        }),
        spot({
          symbol: 'XRPUSDT',
          baseAsset: 'XRP',
          quoteAsset: 'USDT',
          filters: [{ filterType: 'PRICE_FILTER', tickSize: '0' }],
        }),
      ],
    }),
  }));

  const client = new BinanceClient();
  await client.buildIndex();

  assert.equal(client.maxDecimals('btcusdt'), 2);
  assert.equal(client.maxDecimals('BTCEUR'), 2);
  assert.equal(client.maxDecimals('SHIBUSDT'), 6);
  assert.equal(client.maxDecimals('ETHBTC'), 0);
  assert.equal(client.maxDecimals('DOGEUSDT'), 0);
  assert.equal(client.maxDecimals('SOLUSDT'), null);
  assert.equal(client.maxDecimals('XRPUSDT'), null);
  assert.equal(client.maxDecimals('NOPE'), null);
});

test('maxDecimals is null before buildIndex', () => {
  assert.equal(new BinanceClient().maxDecimals('BTCUSDT'), null);
});
