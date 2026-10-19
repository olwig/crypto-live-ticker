import { registerHooks } from 'node:module';
import { compile } from 'svelte/compiler';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

registerHooks({
    load(url, context, nextLoad) {
        if (!url.startsWith('file:') || !url.endsWith('.svelte')) {
            return nextLoad(url, context);
        }
        const filename = fileURLToPath(url);
        const compiled = compile(readFileSync(filename, 'utf8'), {
            filename,
            generate: 'client',
            css: 'injected',
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

for (const name of [
    'window',
    'document',
    'HTMLElement',
    'Element',
    'Node',
    'Text',
    'Comment',
    'DocumentFragment',
    'SVGElement',
    'MutationObserver',
    'Event',
    'MouseEvent',
    'Document',
    'Range',
]) {
    defineGlobal(name, name === 'window' ? window : window[name]);
}
defineGlobal('navigator', window.navigator);
defineGlobal('getComputedStyle', window.getComputedStyle.bind(window));
defineGlobal('requestAnimationFrame', (callback) => window.setTimeout(callback, 0));
defineGlobal('cancelAnimationFrame', (id) => window.clearTimeout(id));

// Node resolves the `svelte` package to the server build, which cannot mount.
const { mount, unmount, flushSync, tick } = await import('../node_modules/svelte/src/index-client.js');
const { default: Harness } = await import('./ClockHarness.svelte');
const { default: Clock } = await import('../src/lib/Clock.svelte');

const RealDate = Date;
const realSetInterval = globalThis.setInterval;
const realClearInterval = globalThis.clearInterval;
const originalFormat = Date.prototype.toLocaleTimeString;

// 100ms into 2026-10-19 15:04:05 UTC, so short intervals can stay inside one second.
const START = Date.UTC(2026, 9, 19, 15, 4, 5, 100);

let now = START;
let timers = [];
let formats = 0;
const mounted = [];

Date.prototype.toLocaleTimeString = function (locales, options) {
    formats += 1;
    return originalFormat.call(this, locales, options);
};

function useFakeTime() {
    now = START;
    timers = [];
    formats = 0;
    let seq = 1;

    function FakeDate(...args) {
        if (!new.target) {
            return RealDate();
        }
        if (args.length === 0) {
            return new RealDate(now);
        }
        return new RealDate(...args);
    }
    FakeDate.now = () => now;
    FakeDate.parse = RealDate.parse;
    FakeDate.UTC = RealDate.UTC;
    FakeDate.prototype = RealDate.prototype;
    Object.setPrototypeOf(FakeDate, RealDate);
    globalThis.Date = FakeDate;
    window.Date = FakeDate;

    const setInterval = (fn, ms) => {
        const timer = { id: seq++, fn, ms, acc: 0 };
        timers.push(timer);
        return timer.id;
    };
    const clearInterval = (id) => {
        const index = timers.findIndex((timer) => timer.id === id);
        if (index !== -1) {
            timers.splice(index, 1);
        }
    };
    globalThis.setInterval = setInterval;
    globalThis.clearInterval = clearInterval;
    window.setInterval = setInterval;
    window.clearInterval = clearInterval;
}

function restoreTime() {
    globalThis.Date = RealDate;
    window.Date = RealDate;
    globalThis.setInterval = realSetInterval;
    globalThis.clearInterval = realClearInterval;
    window.setInterval = realSetInterval;
    window.clearInterval = realClearInterval;
}

async function advance(ms) {
    now += ms;
    for (const timer of [...timers]) {
        if (!timers.includes(timer)) {
            continue;
        }
        timer.acc += ms;
        while (timer.acc >= timer.ms) {
            timer.acc -= timer.ms;
            if (!timers.includes(timer)) {
                break;
            }
            timer.fn();
        }
    }
    await tick();
}

function expected(epochSecond, props) {
    const options = {
        timeZone: props.timezone,
        hour12: props.hour12,
        hour: '2-digit',
        minute: '2-digit',
    };
    if (props.showSeconds) {
        options.second = '2-digit';
    }
    return originalFormat.call(new RealDate(epochSecond * 1000), props.locale, options);
}

function epochSecond() {
    return Math.floor(now / 1000);
}

async function render(props = {}) {
    useFakeTime();
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(Harness, { target, props });
    const entry = { component, target };
    mounted.push(entry);
    await tick();
    return {
        ...entry,
        clock: () => target.querySelector('#clock'),
    };
}

function viewOf(props) {
    return {
        showSeconds: true,
        hour12: false,
        clickTogglesHour12: true,
        interval: 1000,
        locale: 'en-US',
        timezone: 'UTC',
        ...props,
    };
}

afterEach(async () => {
    for (const entry of mounted.splice(0)) {
        await unmount(entry.component);
        entry.target.remove();
    }
    restoreTime();
});

test('renders the current second with the locale, zone, and hour cycle it is given', async () => {
    const view = viewOf({});
    const { clock } = await render(view);
    const el = clock();

    assert.equal(el.textContent, expected(epochSecond(), view));
    assert.equal(el.id, 'clock');
    assert.equal(window.getComputedStyle(el).userSelect, 'none');
    assert.equal(formats, 1);
});

test('omits seconds when showSeconds is false', async () => {
    const view = viewOf({ showSeconds: false });
    const { clock } = await render(view);
    const text = clock().textContent;

    assert.equal(text, expected(epochSecond(), view));
    assert.notEqual(text, expected(epochSecond(), { ...view, showSeconds: true }));
});

test('defaults to seconds on and clickTogglesHour12 off', async () => {
    useFakeTime();
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(Clock, {
        target,
        props: { locale: 'en-US', timezone: 'UTC' },
    });
    mounted.push({ component, target });
    await tick();

    const el = target.querySelector('#clock');
    const view = viewOf({ showSeconds: true, clickTogglesHour12: false });
    assert.equal(el.textContent, expected(epochSecond(), view));
    assert.equal(el.classList.contains('interactive'), false);
    assert.notEqual(window.getComputedStyle(el).cursor, 'pointer');

    const before = formats;
    el.click();
    await tick();
    assert.equal(formats, before);
    assert.equal(el.textContent, expected(epochSecond(), view));
});

test('does not build a new time until the second changes', async () => {
    const view = viewOf({ interval: 100 });
    const { clock } = await render(view);
    const el = clock();
    const seen = el.textContent;
    const before = formats;

    for (let i = 0; i < 8; i += 1) {
        await advance(100);
        assert.equal(el.textContent, seen);
    }
    assert.equal(formats, before);
    assert.equal(timers.length, 1);

    await advance(100);
    const next = viewOf(view);
    assert.equal(el.textContent, expected(epochSecond(), next));
    assert.notEqual(el.textContent, seen);
    assert.equal(formats, before + 1);
});

test('updates the rendered time when the interval reaches a new second', async () => {
    const view = viewOf({ interval: 1000 });
    const { clock } = await render(view);
    const el = clock();
    const seen = el.textContent;

    await advance(900);
    assert.equal(el.textContent, seen);
    assert.equal(timers.length, 1);

    await advance(100);
    assert.equal(el.textContent, expected(epochSecond(), view));
    assert.notEqual(el.textContent, seen);
});

test('applies locale, zone, and hour12 without waiting for the next tick', async () => {
    const view = viewOf({});
    const { component, clock } = await render(view);
    const el = clock();
    const before = formats;

    const zoned = viewOf({ timezone: 'America/New_York' });
    flushSync(() => component.configure({ timezone: zoned.timezone }));
    assert.equal(el.textContent, expected(epochSecond(), zoned));
    assert.notEqual(el.textContent, expected(epochSecond(), view));

    const twelve = viewOf({ timezone: zoned.timezone, hour12: true });
    flushSync(() => component.configure({ hour12: true }));
    assert.equal(component.readHour12(), true);
    assert.equal(el.textContent, expected(epochSecond(), twelve));
    assert.notEqual(expected(epochSecond(), twelve), expected(epochSecond(), zoned));

    const german = viewOf({ ...twelve, locale: 'de-DE' });
    flushSync(() => component.configure({ locale: 'de-DE' }));
    assert.equal(el.textContent, expected(epochSecond(), german));
    assert.ok(formats > before);
});

test('toggles 12 and 24 hour mode on click only when clickTogglesHour12 is on', async () => {
    const view = viewOf({ clickTogglesHour12: true });
    const { component, clock } = await render(view);
    const el = clock();

    assert.equal(el.classList.contains('interactive'), true);
    assert.equal(window.getComputedStyle(el).cursor, 'pointer');

    el.click();
    await tick();
    assert.equal(component.readHour12(), true);
    assert.equal(el.textContent, expected(epochSecond(), viewOf({ hour12: true })));

    el.click();
    await tick();
    assert.equal(component.readHour12(), false);
    assert.equal(el.textContent, expected(epochSecond(), view));
});

test('removes the click listener when clickTogglesHour12 turns off', async () => {
    const { component, clock } = await render(viewOf({ clickTogglesHour12: true }));
    const el = clock();

    flushSync(() => component.configure({ clickTogglesHour12: false }));
    assert.equal(el.classList.contains('interactive'), false);
    assert.notEqual(window.getComputedStyle(el).cursor, 'pointer');

    el.click();
    await tick();
    assert.equal(component.readHour12(), false);
    assert.equal(el.textContent, expected(epochSecond(), viewOf({})));
});

test('restarts the timer when the interval changes and clears it on destroy', async () => {
    const { component, target } = await render(viewOf({ interval: 1000, clickTogglesHour12: true }));
    const el = target.querySelector('#clock');
    const removed = [];
    const originalRemove = el.removeEventListener;
    el.removeEventListener = function (type, listener, options) {
        removed.push(type);
        return originalRemove.call(this, type, listener, options);
    };

    assert.equal(timers.length, 1);
    assert.equal(timers[0].ms, 1000);
    const firstId = timers[0].id;

    flushSync(() => component.configure({ interval: 250 }));
    assert.equal(timers.length, 1);
    assert.equal(timers[0].ms, 250);
    assert.notEqual(timers[0].id, firstId);

    await advance(900);
    assert.equal(el.textContent, expected(epochSecond(), viewOf({})));

    const entry = mounted.pop();
    await unmount(component);
    entry.target.remove();

    assert.equal(timers.length, 0);
    assert.ok(removed.includes('click'));
});
