<script lang="ts">
    import InteractiveMap from "$lib/components/InteractiveMap.svelte";
    import { getMapFromId } from "$lib/mapInfo";
    import { defaultGameState, type GameState } from "$lib/state";
    const mapInfo = getMapFromId("hungary")!;
    let lastClicked = "";
    let arr = [0, 1, 2];
    function cycleTurn() {
        let el = arr.shift()!;
        arr = [...arr, el];
    }
    let gameState: GameState = defaultGameState(mapInfo);
    function onRegionClicked(index: number) {
        const regionStates = gameState.regions;
        if (regionStates[index].type === "empty") {
            lastClicked = mapInfo.regions[index].name;
            regionStates[index] = {
                ownerId: arr[0],
                type: "normal",
                value: 300,
            };
            gameState = gameState;
            cycleTurn();
        }
    }
</script>

<InteractiveMap
    {onRegionClicked}
    regionStates={gameState.regions}
    {mapInfo}
    class="mx-auto w-2/3"
/>
<div>last clicked: {lastClicked}</div>
<div>current player: {arr[0]}</div>
