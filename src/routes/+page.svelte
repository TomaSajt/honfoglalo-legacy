<script>
    import InteractiveMap from "$lib/components/InteractiveMap.svelte";
    import { hungary } from "$lib/mapInfo";
    let lastClicked = "";
</script>

<InteractiveMap
    onRegionClicked={(regionId) => (lastClicked = regionId)}
    mapInfo={hungary}
    class="mx-auto w-2/3"
/>
<div>last clicked: {lastClicked}</div>
