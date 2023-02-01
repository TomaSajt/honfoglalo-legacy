<script lang="ts">
    import type { MapInfo } from "$lib/mapInfo";
    import type { Region as RegionState } from "$lib/state";
    export let mapInfo: MapInfo;
    export let onRegionClicked: (index: number) => void;
    export let regionStates: RegionState[];

    function getRegionColor(regionState: RegionState) {
        if (regionState.type === "empty") return "white";
        if (regionState.ownerId === 0) return "red";
        if (regionState.ownerId === 1) return "green";
        if (regionState.ownerId === 2) return "blue";
        throw "Owner ID was not correct";
    }
</script>

<svg version="1.0" viewBox={mapInfo.viewBox} {...$$restProps}>
    <g>
        {#each mapInfo.regions as regionInfo, i}
            {@const color = getRegionColor(regionStates[i])}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <path
                d={regionInfo.path}
                class="region stroke-black stroke-1 cursor-pointer"
                class:fill-green-300={color === "green"}
                class:fill-blue-300={color === "blue"}
                class:fill-red-300={color === "red"}
                class:fill-white={color === "white"}
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
