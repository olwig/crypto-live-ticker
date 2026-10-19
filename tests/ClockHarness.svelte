<script>
    import Clock from '../src/lib/Clock.svelte';

    let {
        showSeconds: initialShowSeconds = true,
        hour12: initialHour12 = false,
        clickTogglesHour12: initialClickTogglesHour12 = true,
        interval: initialInterval = 1000,
        locale: initialLocale = 'en-US',
        timezone: initialTimezone = 'UTC',
    } = $props();

    let showSeconds = $state(initialShowSeconds);
    let hour12 = $state(initialHour12);
    let clickTogglesHour12 = $state(initialClickTogglesHour12);
    let interval = $state(initialInterval);
    let locale = $state(initialLocale);
    let timezone = $state(initialTimezone);

    export function configure(next) {
        if ('showSeconds' in next) showSeconds = next.showSeconds;
        if ('hour12' in next) hour12 = next.hour12;
        if ('clickTogglesHour12' in next) clickTogglesHour12 = next.clickTogglesHour12;
        if ('interval' in next) interval = next.interval;
        if ('locale' in next) locale = next.locale;
        if ('timezone' in next) timezone = next.timezone;
    }

    export function readHour12() {
        return hour12;
    }
</script>

<Clock
    {showSeconds}
    bind:hour12
    {clickTogglesHour12}
    {interval}
    {locale}
    {timezone}
/>
