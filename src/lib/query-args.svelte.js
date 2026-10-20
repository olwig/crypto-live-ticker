import { app } from './store.svelte.js';
import { themeManager } from './theme-manager.svelte.js';

// Address-bar bridge. Defaults stay in the module that owns each value.
// A key is written only when it is already in the bar.
// To add an arg, append one entry. parse returns the designed type or throws.
// read and write go through the owner. This module does not keep the values.

const queryArgs = [
    {
        key: 'symbol',
        parse(raw) {
            const value = String(raw ?? '').trim().toUpperCase();
            if (value === '') {
                throw new TypeError('symbol must be a non-empty string');
            }
            return value;
        },
        read() {
            return app.symbol;
        },
        write(value) {
            app.symbol = value;
        },
    },
    {
        key: 'interval',
        parse(raw) {
            return parseInteger(raw, 'interval');
        },
        read() {
            return String(app.interval);
        },
        write(value) {
            app.interval = value;
        },
    },
    {
        key: 'decimals',
        parse(raw) {
            return parseInteger(raw, 'decimals');
        },
        read() {
            return String(app.decimals);
        },
        write(value) {
            app.decimals = value;
        },
    },
    {
        key: 'theme',
        parse(raw) {
            const value = String(raw ?? '').trim().toLowerCase();
            if (!themeManager.has(value)) {
                throw new TypeError(`unknown theme "${value}"`);
            }
            return value;
        },
        read() {
            return themeManager.get();
        },
        write(value) {
            themeManager.set(value);
        },
    },
];

let installed = false;

export function installQueryArgs() {
    if (installed) {
        return () => {};
    }
    installed = true;
    applyFromBar();
    const stopEffects = watch();
    const onPopState = () => {
        applyFromBar();
    };
    window.addEventListener('popstate', onPopState);
    return () => {
        if (!installed) {
            return;
        }
        stopEffects();
        window.removeEventListener('popstate', onPopState);
        installed = false;
    };
}

function parseInteger(raw, key) {
    const value = parseInt(String(raw ?? '').trim(), 10);
    if (Number.isNaN(value)) {
        throw new TypeError(`${key} must be an integer`);
    }
    return value;
}

function applyFromBar() {
    const params = new URLSearchParams(window.location.search);
    for (const arg of queryArgs) {
        if (!params.has(arg.key)) {
            continue;
        }
        const raw = params.get(arg.key);
        let value;
        try {
            value = arg.parse(raw);
        } catch (error) {
            console.error(`Invalid query arg "${arg.key}".`, raw, error);
            continue;
        }
        arg.write(value);
        writeIfPresent(arg.key, arg.read());
    }
}

function watch() {
    return $effect.root(() => {
        for (const arg of queryArgs) {
            let first = true;
            $effect(() => {
                const text = arg.read();
                if (first) {
                    first = false;
                    return;
                }
                writeIfPresent(arg.key, text);
            });
        }
    });
}

function writeIfPresent(key, value) {
    const params = new URLSearchParams(window.location.search);
    if (!params.has(key)) {
        return;
    }
    const text = String(value);
    if (params.get(key) === text) {
        return;
    }
    params.set(key, text);
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', url);
}
