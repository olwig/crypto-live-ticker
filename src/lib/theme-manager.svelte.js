

class ThemeManager {
    #THEME_STORAGE_KEY = 'ui.theme';
    #THEMES = {
        dark: 'Dark Mode',
        light: 'Light Mode',
    };
    #DEFAULT_THEME = Object.keys(this.#THEMES)[0];

    #state;

    constructor() {
        this.#state = $state(this.#read());
    }

    has(name) {
        return Object.hasOwn(this.#THEMES, name);
    }

    list() {
        return Object.keys(this.#THEMES);
    }

    stringify(name) {
        const label = this.#THEMES[name];
        if (!label) {
            throw new Error(`Invalid theme name: ${name}`);
        }
        return label;
    }

    nextToogle() {
        const themeIds = this.list();
        const currentTheme = this.#state;
        const currentIndex = themeIds.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themeIds.length;
        return themeIds[nextIndex];
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

    get() {
        return this.#state;
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
