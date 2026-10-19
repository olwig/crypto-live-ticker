<script>
    let {
        showSeconds = true,
        hour12 = $bindable(false),
        clickTogglesHour12 = false,
        interval = 1000,
        // Initializers keep later parent updates reactive. Undefined adds no locale or zone.
        locale = undefined,
        timezone = undefined,
    } = $props();

    let root = $state(null);
    let epochSecond = $state(Math.floor(Date.now() / 1000));

    $effect(() => {
        const ms = interval;
        const id = setInterval(() => {
            const next = Math.floor(Date.now() / 1000);
            // Same second: keep the previous instant so the clock does not render again.
            if (next !== epochSecond) {
                epochSecond = next;
            }
        }, ms);
        return () => clearInterval(id);
    });

    $effect(() => {
        if (!clickTogglesHour12 || root == null) {
            return;
        }
        const el = root;
        const onClick = () => {
            hour12 = !hour12;
        };
        el.addEventListener('click', onClick);
        return () => el.removeEventListener('click', onClick);
    });

    let text = $derived.by(() => {
        const options = {
            timeZone: timezone,
            hour12,
            hour: '2-digit',
            minute: '2-digit',
        };
        if (showSeconds) {
            options.second = '2-digit';
        }
        return new Date(epochSecond * 1000).toLocaleTimeString(locale, options);
    });
</script>

<div id="clock" class:interactive={clickTogglesHour12} bind:this={root}>{text}</div>

<style>
    div {
        user-select: none;
        -webkit-user-select: none;
    }

    .interactive {
        cursor: pointer;
    }
</style>
