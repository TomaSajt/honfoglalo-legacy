<script lang="ts">
    import type { MapInfo } from "$lib/mapInfo";
    export let mapInfo: MapInfo;
    export let onRegionClicked: (regionId: string) => void;
    let lastClicked = "";
</script>

<svg version="1.0" viewBox={mapInfo.viewBox} {...$$restProps}>
    <g>
        {#each mapInfo.regions as region (region.id)}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <path
                tabindex="-1"
                d={region.path}
                class="region fill-green-300 stroke-black stroke-1 cursor-pointer"
                on:click={() => onRegionClicked(region.id)}
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
            @apply fill-lime-200;
        }
    }
</style>
