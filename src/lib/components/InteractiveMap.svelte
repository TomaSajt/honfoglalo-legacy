<script lang="ts">
    import type { MapInfo, RegionState } from "$lib/mapInfo";
    export let mapInfo: MapInfo;
    export let onRegionClicked: (index: number) => void;
    export let regionStates: RegionState[];
</script>

<svg version="1.0" viewBox={mapInfo.viewBox} {...$$restProps}>
    <g>
        {#each mapInfo.regions as region, i}
            {@const isGreen = regionStates[i].owner === "green"}
            {@const isRed = regionStates[i].owner === "red"}
            {@const isBlue = regionStates[i].owner === "blue"}
            {@const hasNoOwner = regionStates[i].owner === "none"}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <path
                d={region.path}
                class="region stroke-black stroke-1 cursor-pointer"
                class:fill-green-300={isGreen}
                class:fill-blue-300={isBlue}
                class:fill-red-300={isRed}
                class:fill-white={hasNoOwner}
                on:click={() => onRegionClicked(i)}
            />
        {/each}
    </g>
    <g>
        <path
            d={mapInfo.borderPath}
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
