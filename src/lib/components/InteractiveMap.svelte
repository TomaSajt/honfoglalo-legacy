<script lang="ts">
    import { hungaryMapInfo } from "$lib/mapInfo";
    import { playerIdToStringId, playerIdToWeakCssColor } from "$lib/player";
    import type { Region as RegionState } from "$lib/state";
    import { assert } from "$lib/utils";
    import {
        fly,
        fade,
        type FlyParams,
        type FadeParams,
    } from "svelte/transition";
    export let onRegionClicked: (index: number) => void;
    export let regionStates: RegionState[];

    const flyParams: FlyParams = {
        y: -50,
        duration: 200,
        easing: (x) => x * x,
    };
    const fadeParams: FadeParams = { duration: 200 };

    function getRegionColor(regionState: RegionState) {
        if (regionState.type === "empty" || regionState.type === "marked")
            return "white";
        return playerIdToWeakCssColor(regionState.player);
    }

    function getFortImageUrl(regionState: RegionState) {
        assert(regionState.type === "fort");
        let name = playerIdToStringId(regionState.player);
        return `fort/${name}/${regionState.towersRemaining}.png`;
    }
</script>

<svg version="1.0" viewBox={hungaryMapInfo.viewBox} {...$$restProps}>
    <g>
        {#each hungaryMapInfo.regions as regionInfo, i}
            {@const regionState = regionStates[i]}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <path
                fill={getRegionColor(regionState)}
                d={regionInfo.path}
                class="region stroke-black stroke-1 cursor-pointer"
                on:click={() => onRegionClicked(i)}
            />

            {#if regionState.type === "fort"}
                <image
                    in:fly|local={flyParams}
                    out:fade|local={fadeParams}
                    href={getFortImageUrl(regionStates[i])}
                    width="60"
                    x={regionInfo.centerPos[0] - 30}
                    y={regionInfo.centerPos[1] - 35}
                />
            {:else if regionState.type === "marked"}
                <image
                    in:fly|local={flyParams}
                    out:fade|local={fadeParams}
                    href="logo_512.png"
                    width="40"
                    x={regionInfo.centerPos[0] - 20}
                    y={regionInfo.centerPos[1] - 20}
                />
            {/if}
            <circle
                cx={regionInfo.centerPos[0]}
                cy={regionInfo.centerPos[1]}
                r="5"
            />
        {/each}
    </g>
    <g>
        <path
            d={hungaryMapInfo.borderPath}
            class="fill-none stroke-red-600 stroke-[3]"
        />
    </g>
</svg>

<style lang="postcss">
    @media (hover: hover) {
        .region:hover {
            @apply brightness-90;
        }
    }
</style>
