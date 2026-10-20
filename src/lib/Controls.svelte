<script>
	import { onMount } from 'svelte';
	import { themeManager } from '../lib/theme-manager.svelte.js';
    import { app } from '../lib/store.svelte.js';

	const symbols = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'AAPL'];
	let selectedSymbol = $state(symbols[0]);

	let zoom = $state(1.0);

	function changeDecimals(delta) {
        // TODO pass max/min as params
		app.decimals = Math.max(0, Math.min(8, app.decimals + delta));
	}

	function changeZoom(delta) {
		const next = Math.round((zoom + delta) * 10) / 10;
		zoom = Math.max(0.5, Math.min(5, next));
	}

	let open = $state(false);

	function onDocumentClick(event) {
		const box = document.querySelector('.controls');
		if (box && box.contains(event.target)) {
			return;
		}
		open = false;
		document.removeEventListener('click', onDocumentClick);
	}

	function showControls(event) {
		event.stopPropagation();
		open = true;
		queueMicrotask(() => document.addEventListener('click', onDocumentClick));
	}

	onMount(() => {
		return () => document.removeEventListener('click', onDocumentClick);
	});
</script>

<div class="controls" class:closed={!open} role="toolbar" aria-label="Chart Controls">
	{#if !open}
		<button
			type="button"
			class="launcher"
			aria-expanded="false"
			aria-label="Show controls"
			onclick={showControls}
		>
			⚙
		</button>
	{:else}
	<label class="entry">
		<span class="label">Symbol</span>
		<select bind:value={app.symbol}>
			{#each app.symbols as symbol}
				<option value={symbol}>{symbol}</option>
			{/each}
		</select>
	</label>

	<label class="entry">
		<span class="label">Theme</span>
		<select
			value={themeManager.get()}
			onchange={(event) => themeManager.set(event.currentTarget.value)}
		>
			{#each themeManager.list() as id, index}
				<option value={id}>{themeManager.list(true)[index]}</option>
			{/each}
		</select>
	</label>

	<button
		type="button"
		class="entry"
		aria-pressed={themeManager.get() === themeManager.togglePair()[0]}
		onclick={() => themeManager.toggle()}
	>
		{themeManager.nextToogle(true)}
	</button>

	<div class="entry group">
		<span class="label">Dezimal</span>
		<button type="button" onclick={() => changeDecimals(-1)}>−</button>
		<span class="value">{app.decimals}</span>
		<button type="button" onclick={() => changeDecimals(1)}>+</button>
	</div>

	<div class="entry group">
		<span class="label">Zoom</span>
		<button type="button" onclick={() => changeZoom(-0.1)}>−</button>
		<span class="value">{zoom.toFixed(1)}</span>
		<button type="button" onclick={() => changeZoom(0.1)}>+</button>
	</div>
	{/if}
</div>

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: var(--controls-gap);
		align-items: center;
		padding: var(--controls-padding);

        font-size: 0.9rem;
	}

	.closed {
		background: none;
		border: 0;
		padding: 0;
		gap: 0;
	}

	.controls .launcher,
	.controls .launcher:hover,
	.controls .launcher:active {
		background: none;
		border: 0;
		margin: 0.25rem;
		padding: 0.65rem;
		box-shadow: none;
		appearance: none;
		color: inherit;
		line-height: 1;
		font-size: 1.25rem;
		cursor: pointer;
	}

	.entry {
		display: flex;
		align-items: center;
		gap: var(--entry-gap);
	}

	.label {
		font-size: 0.8rem;
		opacity: var(--label-opacity);
		color: var(--label-color);
	}

	.value {
		min-width: 2ch;
		text-align: center;
		font-variant-numeric: tabular-nums;
		color: var(--value-color);
	}

	button,
	select {
		font: inherit;
		border-radius: var(--control-radius);
	}
</style>