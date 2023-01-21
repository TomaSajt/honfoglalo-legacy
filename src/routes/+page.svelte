<script lang="ts">
    import InteractiveMap from "$lib/components/InteractiveMap.svelte";
    import { hungary, type RegionState } from "$lib/mapInfo";
    const mapInfo = hungary;
    let lastClicked = "";
    let arr = ["green", "blue", "red"] as ("green" | "blue" | "red")[];
    function cycle() {
        let el = arr.shift()!;
        arr = [...arr, el];
    }
    let regionStates: RegionState[] = mapInfo.regions.map(() => ({
        owner: "none",
    }));
    function onRegionClicked(index: number) {
        if (regionStates[index].owner !== "none") return;
        lastClicked = mapInfo.regions[index].name;
        regionStates[index].owner = arr[0];
        cycle();
    }
</script>

<InteractiveMap
    {onRegionClicked}
    {regionStates}
    {mapInfo}
    class="mx-auto w-2/3"
/>
<div>last clicked: {lastClicked}</div>
<div>current player: {arr[0]}</div>
