
<div class="controls-wrapper">
  <Controls />
</div>

<div id="ticker-symbol">
  <img id="ticker-image" src="{symbolIndex.url(app.symbol)}" alt="{symbolUpper} logo">
  <span id="ticker-text">{symbolUpper}</span>
</div>
<div id="btc-price">{formattedPrice}</div>
<div id="clock">{formattedTime}</div>

<script>
    import { onMount } from 'svelte';
    import { app } from './lib/store.svelte.js';
    import {symbolIndex} from './lib/symbolIndex.js';
    import { themeManager as theme } from './lib/theme-manager.svelte.js';
    import Controls from './lib/Controls.svelte';

    const apiUrlStub = 'https://api.binance.com/api/v3/ticker/price?symbol=';

    // TODO zoom

    let symbolLower = $derived(app.symbol.toLowerCase());
    let symbolUpper = $derived(app.symbol.toUpperCase());

    // format price on price change
    let formattedPrice = $derived.by(() => {
        return app.price.toLocaleString(
            app.locale, 
            { 
                minimumFractionDigits: app.decimals, 
                maximumFractionDigits: app.decimals 
            }
        );
    });

    // format time on clock change
    let formattedTime = $derived.by(() => {
        return app.clock.toLocaleTimeString(
            app.locale, 
            {
                timeZone: app.timezone,
                hour12: app.hour12,  
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit'  
            }
        );
    });

    // Pre-rendering effect for external DOM manipulations
    $effect(() => {
        // TODO move outside to subscriber
        const link = document.querySelector('link[rel="icon"]');
        if (!(link instanceof HTMLLinkElement)) {
            throw new Error('Favicon link element not found');
        }
        link.href = symbolIndex.url(app.symbol);

        // TODO move outside to subscriber
        document.title = formattedPrice;
    });

    function onDecimalsToggle() {
        app.decimals = (app.decimals + 1) % 3;
    }

    function onDecimalsIncrease() {
        app.decimals = Math.min(app.decimals + 1, 5);
    }

    function onDecimalsDecrease() {
        app.decimals = Math.max(app.decimals - 1, 0);
    }

    onMount(async () => {       
        
    });

</script>