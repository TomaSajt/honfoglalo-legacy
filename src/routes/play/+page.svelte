<script lang="ts">
    import InteractiveMap from "$lib/components/InteractiveMap.svelte";
    import { getMapFromId } from "$lib/mapInfo";
    import { playerIdToHungarianName } from "$lib/player";
    import { defaultGameState, type GameState } from "$lib/state";
    const mapInfo = getMapFromId("hungary")!;
    let lastClicked = "";
    let currentPlayer = 0;
    function cycleTurn() {
        currentPlayer = (currentPlayer + 1) % 3;
    }
    let gameState: GameState = defaultGameState(mapInfo);
    function onRegionClicked(index: number) {
        const regionStates = gameState.regions;
        if (regionStates[index].type === "empty") {
            lastClicked = mapInfo.regions[index].name;
            regionStates[index] = {
                ownerId: currentPlayer,
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
<div>Utoljára elfoglalt megye: {lastClicked}</div>
<div>Jelenlegi játékos: {playerIdToHungarianName(currentPlayer)}</div>
