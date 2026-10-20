import { registerHooks } from 'node:module';
import { compileModule } from 'svelte/compiler';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

registerHooks({
    load(url, context, nextLoad) {
        if (!url.startsWith('file:') || !url.endsWith('.svelte.js')) {
            return nextLoad(url, context);
        }
        const filename = fileURLToPath(url);
        const compiled = compileModule(readFileSync(filename, 'utf8'), {
            filename,
            generate: 'client',
            dev: false,
        });
        return {
            format: 'module',
            source: compiled.js.code,
            shortCircuit: true,
        };
    },
});

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost/',
});
const { window } = dom;

function defineGlobal(name, value) {
    try {
        Object.defineProperty(globalThis, name, {
            value,
            configurable: true,
            writable: true,
        });
    } catch {
        // Node already exposes some of these as non-configurable getters.
    }
}

for (const name of ['window', 'document', 'localStorage', 'PopStateEvent']) {
    defineGlobal(name, name === 'window' ? window : window[name]);
}

const { flushSync } = await import('../node_modules/svelte/src/index-client.js');
const { app } = await import('../src/lib/store.svelte.js');
const { themeManager } = await import('../src/lib/theme-manager.svelte.js');
const { installQueryArgs } = await import('../src/lib/query-args.svelte.js');

const realError = console.error;
const realReplaceState = window.history.replaceState.bind(window.history);
let errors = [];
let stop = () => {};
let replaceCalls = 0;

function countReplaceState(state, title, url) {
    replaceCalls += 1;
    realReplaceState(state, title, url);
}

function open(path) {
    realReplaceState(null, '', path);
    return window.location.search;
}

function start(path) {
    const search = open(path);
    stop = installQueryArgs();
    return search;
}

afterEach(() => {
    stop();
    stop = () => {};
    console.error = realError;
    window.history.replaceState = realReplaceState;
    errors = [];
    replaceCalls = 0;
    app.symbol = 'BTCUSDT';
    app.interval = 1;
    app.decimals = 0;
    window.localStorage.clear();
    themeManager.set('light');
    realReplaceState(null, '', '/');
});

test('missing keys keep the values owned by their modules', () => {
    app.symbol = 'SOLUSDT';
    app.interval = 7;
    app.decimals = 4;
    themeManager.set('sleep');
    start('/?symbol=ethusdt');
    flushSync();

    assert.equal(app.symbol, 'ETHUSDT');
    assert.equal(app.interval, 7);
    assert.equal(app.decimals, 4);
    assert.equal(themeManager.get(), 'sleep');
    assert.equal(window.location.search, '?symbol=ETHUSDT');
});

test('present args are coerced and written through the owning modules', () => {
    window.localStorage.clear();
    start('/?symbol=%20ethusdt%20&interval=5&decimals=2&theme=DARK');
    flushSync();

    assert.equal(app.symbol, 'ETHUSDT');
    assert.equal(app.interval, 5);
    assert.equal(typeof app.interval, 'number');
    assert.equal(app.decimals, 2);
    assert.equal(typeof app.decimals, 'number');
    assert.equal(themeManager.get(), 'dark');
    assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
    assert.equal(window.localStorage.getItem('ui.theme'), 'dark');
    assert.equal(window.location.search, '?symbol=ETHUSDT&interval=5&decimals=2&theme=dark');
});

test('zero is applied when the key is present', () => {
    app.interval = 7;
    app.decimals = 4;
    start('/?interval=0&decimals=0');
    flushSync();

    assert.equal(app.interval, 0);
    assert.equal(app.decimals, 0);
});

test('interval and decimals use parseInt and stay in seconds', () => {
    start('/?interval=5abc&decimals=2xyz');
    flushSync();

    assert.equal(app.interval, 5);
    assert.equal(app.decimals, 2);
    assert.equal(window.location.search, '?interval=5&decimals=2');
});

test('invalid values are ignored, logged, and left in the bar', () => {
    app.symbol = 'SOLUSDT';
    app.interval = 7;
    app.decimals = 4;
    themeManager.set('sleep');
    console.error = (...args) => {
        errors.push(args.map(String).join(' '));
    };
    window.history.replaceState = countReplaceState;
    const before = start('/?symbol=%20&interval=nope&decimals=&theme=nope&keep=1');
    flushSync();

    assert.equal(app.symbol, 'SOLUSDT');
    assert.equal(app.interval, 7);
    assert.equal(app.decimals, 4);
    assert.equal(themeManager.get(), 'sleep');
    assert.equal(window.location.search, before);
    assert.equal(replaceCalls, 0);
    for (const key of ['symbol', 'interval', 'decimals', 'theme']) {
        assert.ok(errors.some((line) => line.includes(key)), key);
    }
});

test('a valid arg is applied beside an invalid one', () => {
    app.interval = 7;
    console.error = (...args) => {
        errors.push(args.map(String).join(' '));
    };
    start('/?interval=nope&symbol=ethusdt');
    flushSync();

    assert.equal(app.symbol, 'ETHUSDT');
    assert.equal(app.interval, 7);
    assert.match(window.location.search, /interval=nope/);
    assert.match(window.location.search, /symbol=ETHUSDT/);
    assert.ok(errors.some((line) => line.includes('interval')));
});

test('canonical rewrite keeps pathname, hash, history state, and other keys', () => {
    window.history.replaceState({ n: 1 }, '', '/board?foo=1&symbol=ethusdt&bar=2#spot');
    stop = installQueryArgs();
    flushSync();

    assert.equal(window.location.pathname, '/board');
    assert.equal(window.location.hash, '#spot');
    assert.equal(window.location.search, '?foo=1&symbol=ETHUSDT&bar=2');
    assert.deepEqual(window.history.state, { n: 1 });
});

test('the query module does not write storage for symbol, interval, or decimals', () => {
    window.localStorage.clear();
    themeManager.set('light');
    start('/?symbol=ETHUSDT&interval=4&decimals=1');
    flushSync();

    assert.equal(window.localStorage.length, 1);
    assert.equal(window.localStorage.getItem('ui.theme'), 'light');
});

test('a state change updates only that key when it is already in the bar', () => {
    window.history.replaceState({ n: 1 }, '', '/?decimals=2&foo=1');
    stop = installQueryArgs();
    flushSync();

    app.symbol = 'XRPUSDT';
    app.interval = 9;
    themeManager.set('tui');
    flushSync();
    assert.equal(window.location.search, '?decimals=2&foo=1');

    app.decimals = 6;
    flushSync();
    assert.equal(window.location.search, '?decimals=6&foo=1');
    assert.deepEqual(window.history.state, { n: 1 });
    assert.equal(app.symbol, 'XRPUSDT');
});

test('state changes add nothing when the bar has no query', () => {
    start('/');
    flushSync();
    app.symbol = 'XRPUSDT';
    app.interval = 9;
    app.decimals = 3;
    themeManager.set('tui');
    flushSync();

    assert.equal(window.location.search, '');
    assert.equal(window.location.pathname, '/');
});

test('an invalid key stays until that same state changes', () => {
    console.error = (...args) => {
        errors.push(args.map(String).join(' '));
    };
    start('/?theme=nope');
    flushSync();
    assert.match(window.location.search, /theme=nope/);
    assert.equal(themeManager.get(), 'light');

    app.symbol = 'XRPUSDT';
    flushSync();
    assert.match(window.location.search, /theme=nope/);

    themeManager.set('tui');
    flushSync();
    assert.equal(window.location.search, '?theme=tui');
});

test('a failed price symbol in state follows the bar', () => {
    start('/?symbol=ETHUSDT');
    flushSync();
    app.symbol = 'ERR';
    flushSync();
    assert.equal(window.location.search, '?symbol=ERR');
});

test('replaceState from a state change does not apply the bar again', () => {
    start('/?symbol=ETHUSDT');
    flushSync();
    window.history.replaceState = countReplaceState;
    app.symbol = 'BNBUSDT';
    flushSync();

    assert.equal(replaceCalls, 1);
    assert.equal(app.symbol, 'BNBUSDT');
    assert.equal(window.location.search, '?symbol=BNBUSDT');
});

test('the first watch does not rewrite a value apply already canonicalized', () => {
    window.history.replaceState = countReplaceState;
    start('/?symbol=ethusdt');
    flushSync();

    assert.equal(replaceCalls, 1);
    assert.equal(window.location.search, '?symbol=ETHUSDT');
});

test('popstate applies only keys present in the new bar', () => {
    app.interval = 7;
    start('/?symbol=ETHUSDT');
    flushSync();
    window.history.pushState(null, '', '/?symbol=solusdt&decimals=3');
    window.dispatchEvent(new PopStateEvent('popstate'));
    flushSync();

    assert.equal(app.symbol, 'SOLUSDT');
    assert.equal(app.decimals, 3);
    assert.equal(app.interval, 7);
    assert.equal(window.location.search, '?symbol=SOLUSDT&decimals=3');
});

test('popstate to a bar without a key leaves that state as it is', () => {
    start('/?symbol=ETHUSDT&decimals=2');
    flushSync();
    window.history.pushState(null, '', '/?decimals=5');
    window.dispatchEvent(new PopStateEvent('popstate'));
    flushSync();

    assert.equal(app.symbol, 'ETHUSDT');
    assert.equal(app.decimals, 5);
    assert.equal(window.location.search, '?decimals=5');
});

test('a second install while active does not apply again', () => {
    start('/?symbol=ETHUSDT');
    flushSync();
    realReplaceState(null, '', '/?symbol=SOLUSDT');
    const second = installQueryArgs();
    flushSync();

    assert.equal(app.symbol, 'ETHUSDT');
    second();
    app.symbol = 'BNBUSDT';
    flushSync();
    assert.equal(window.location.search, '?symbol=BNBUSDT');
});

test('dispose stops bar updates and popstate, and install can run again', () => {
    start('/?symbol=ETHUSDT');
    flushSync();
    stop();
    stop = () => {};
    app.symbol = 'SOLUSDT';
    flushSync();
    assert.equal(window.location.search, '?symbol=ETHUSDT');

    window.history.pushState(null, '', '/?symbol=BNBUSDT');
    window.dispatchEvent(new PopStateEvent('popstate'));
    flushSync();
    assert.equal(app.symbol, 'SOLUSDT');

    start('/?symbol=XRPUSDT');
    flushSync();
    assert.equal(app.symbol, 'XRPUSDT');
    assert.equal(window.location.search, '?symbol=XRPUSDT');
});
