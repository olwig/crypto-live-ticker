<script>
	import { themeManager } from '../lib/theme-manager.svelte.js';
    import { app } from '../lib/store.svelte.js';

	const symbols = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'AAPL'];
	let selectedSymbol = $state(symbols[0]);

	let decimals = $state(2);
	let zoom = $state(1.0);

	function changeDecimals(delta) {
        // TODO pass max/min as params
		decimals = Math.max(0, Math.min(8, decimals + delta));
        app.decimals = decimals;
	}

	function changeZoom(delta) {
		const next = Math.round((zoom + delta) * 10) / 10;
		zoom = Math.max(0.5, Math.min(5, next));
	}
</script>

<div class="controls" role="toolbar" aria-label="Chart Controls">

	<label class="entry">
		<span class="label">Symbol</span>
		<select bind:value={app.symbol}>
			{#each app.symbols as symbol}
				<option value={symbol}>{symbol}</option>
			{/each}
		</select>
	</label>

	<button
		type="button"
		class="entry"
		aria-pressed={themeManager.get() === 'dark'}
		onclick={() => themeManager.toggle()}
	>
		{themeManager.get() === 'dark' ? 'Light' : 'Dark'}
	</button>

	<div class="entry group">
		<span class="label">Dezimal</span>
		<button type="button" onclick={() => changeDecimals(-1)}>−</button>
		<span class="value">{decimals}</span>
		<button type="button" onclick={() => changeDecimals(1)}>+</button>
	</div>

	<div class="entry group">
		<span class="label">Zoom</span>
		<button type="button" onclick={() => changeZoom(-0.1)}>−</button>
		<span class="value">{zoom.toFixed(1)}</span>
		<button type="button" onclick={() => changeZoom(0.1)}>+</button>
	</div>
</div>

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		padding: 0.5rem;

        font-size: 0.9rem;
	}

	.entry {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.label {
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.value {
		min-width: 2ch;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	button,
	select {
		font: inherit;
	}
</style>