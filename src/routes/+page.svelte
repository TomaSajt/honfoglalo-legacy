<script>
    import InteractiveMap from "$lib/components/InteractiveMap.svelte";
    import { hungary } from "$lib/mapInfo";
</script>

<div class="grid place-items-center h-full">
    <InteractiveMap
        onRegionClicked={(regionId) => alert(regionId)}
        mapInfo={hungary}
        class="mx-auto w-2/3"
    />
</div>