import { registerHooks } from 'node:module';
import { compileModule } from 'svelte/compiler';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
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

const { app, syncLocale, syncTimezone, watchLocaleChanges } = await import('../src/lib/store.svelte.js');

afterEach(() => {
  app.locale = 'en-US';
  app.timezone = 'UTC';
});

function withLanguage(language, run) {
  const previous = Object.getOwnPropertyDescriptor(navigator, 'language');
  Object.defineProperty(navigator, 'language', {
    configurable: true,
    get() {
      return language;
    },
  });
  try {
    return run();
  } finally {
    if (previous) {
      Object.defineProperty(navigator, 'language', previous);
    } else {
      delete navigator.language;
    }
  }
}

function withTimeZone(timeZone, run) {
  const original = Intl.DateTimeFormat;
  Intl.DateTimeFormat = function DateTimeFormat() {
    return {
      resolvedOptions() {
        return { timeZone };
      },
    };
  };
  try {
    return run();
  } finally {
    Intl.DateTimeFormat = original;
  }
}

test('writes the browser locale and time zone onto the app state', () => {
  withLanguage('de-DE', () => syncLocale());
  withTimeZone('Europe/Berlin', () => syncTimezone());

  assert.equal(app.locale, 'de-DE');
  assert.equal(app.timezone, 'Europe/Berlin');
});

test('languagechange updates the locale and leaves the time zone', () => {
  const target = new EventTarget();
  app.timezone = 'UTC';
  watchLocaleChanges(target);

  withLanguage('fr-FR', () => {
    target.dispatchEvent(new Event('languagechange'));
  });

  assert.equal(app.locale, 'fr-FR');
  assert.equal(app.timezone, 'UTC');
});

test('timezonechange updates the time zone and leaves the locale', () => {
  const target = new EventTarget();
  app.locale = 'de-DE';
  watchLocaleChanges(target);

  withTimeZone('America/New_York', () => {
    target.dispatchEvent(new Event('timezonechange'));
  });

  assert.equal(app.locale, 'de-DE');
  assert.equal(app.timezone, 'America/New_York');
});

test('an unrelated event does not change locale or time zone', () => {
  const target = new EventTarget();
  withLanguage('de-DE', () => syncLocale());
  withTimeZone('Europe/Berlin', () => syncTimezone());
  watchLocaleChanges(target);

  withLanguage('en-US', () => {
    withTimeZone('UTC', () => {
      target.dispatchEvent(new Event('click'));
    });
  });

  assert.equal(app.locale, 'de-DE');
  assert.equal(app.timezone, 'Europe/Berlin');
});

test('the cleanup function stops later locale and time zone events', () => {
  const target = new EventTarget();
  const stop = watchLocaleChanges(target);
  stop();

  withLanguage('fr-FR', () => {
    withTimeZone('America/New_York', () => {
      target.dispatchEvent(new Event('languagechange'));
      target.dispatchEvent(new Event('timezonechange'));
    });
  });

  assert.equal(app.locale, 'en-US');
  assert.equal(app.timezone, 'UTC');
});
