

class ThemeManager {
    #THEME_STORAGE_KEY = 'ui.theme';
    #THEMES = {
        dark: 'Dark Mode',
        sleep: 'Sleep',
        light: 'Light Mode',
        tui: 'TUI',
        html: "90's HTML",
    };
    #DEFAULT_THEME = 'light';

    #state;
    #togglePair = $state(['dark', 'light']);

    constructor() {
        this.#state = $state(this.#read());
        this.setTogglePair('dark', 'light');
    }

    has(name) {
        return Object.hasOwn(this.#THEMES, name);
    }

    list(stringified = false) {
        const ids = Object.keys(this.#THEMES);
        if (!stringified) {
            return ids;
        }
        return ids.map((id) => this.stringify(id));
    }

    stringify(name) {
        const label = this.#THEMES[name];
        if (!label) {
            throw new Error(`Invalid theme name: ${name}`);
        }
        return label;
    }

    setTogglePair(first, second) {
        if (!this.has(first) || !this.has(second) || first === second) {
            throw new Error(`Invalid toggle pair: ${first}, ${second}`);
        }
        this.#togglePair = [first, second];
    }

    togglePair() {
        return [...this.#togglePair];
    }

    nextToogle(stringified = false) {
        const pair = this.#togglePair;
        const index = pair.indexOf(this.#state);
        const next = index === -1 ? pair[0] : pair[(index + 1) % pair.length];
        return stringified ? this.stringify(next) : next;
    }

    toggle() {
        const nextTheme = this.nextToogle();
        this.set(nextTheme);
    }

    set(name) {
        // red from store or default of nothing passed in
        if (name === '') {
            name = this.#read();
        }

        // must be valid theme name
        if (!this.has(name)) {
            throw new Error(`Invalid theme name: ${name}`);
        }

        // update
        this.#state = name;
        document.documentElement.setAttribute('data-theme', name);
        localStorage.setItem(this.#THEME_STORAGE_KEY, name);
    }

    get(stringified = false) {
        const name = this.#state;
        return stringified ? this.stringify(name) : name;
    }

    #read() {
        const storedTheme = localStorage.getItem(this.#THEME_STORAGE_KEY);
        if (storedTheme && this.has(storedTheme)) {
            return storedTheme;
        }
        return this.#DEFAULT_THEME;
    }
}

export const themeManager = new ThemeManager();
