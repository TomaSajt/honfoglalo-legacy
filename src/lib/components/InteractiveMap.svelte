<script lang="ts">
    import { hungaryMapInfo, type MapInfo } from "$lib/mapInfo";
    import {
        playerIdToStrongCssColor,
        playerIdToVeryWeakCssColor,
        playerIdToWeakCssColor,
    } from "$lib/player";
    import type { Region as RegionState } from "$lib/state";
    export let onRegionClicked: (index: number) => void;
    export let regionStates: RegionState[];

    function getRegionColor(regionState: RegionState) {
        if (regionState.type === "empty") return "white";
        return regionState.type === "fort"
            ? playerIdToStrongCssColor(regionState.ownerId)
            : regionState.type === "marked"
            ? playerIdToVeryWeakCssColor(regionState.ownerId)
            : playerIdToWeakCssColor(regionState.ownerId);
    }
</script>

<svg version="1.0" viewBox={hungaryMapInfo.viewBox} {...$$restProps}>
    <g>
        {#each hungaryMapInfo.regions as regionInfo, i}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <path
                fill={getRegionColor(regionStates[i])}
                d={regionInfo.path}
                class="region stroke-black stroke-1 cursor-pointer"
                on:click={() => onRegionClicked(i)}
            />
            
            <image
                href="logo_512.png"
                width="50"
                x={regionInfo.centerPos[0] - 25}
                y={regionInfo.centerPos[1] - 25}
            />
            

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
