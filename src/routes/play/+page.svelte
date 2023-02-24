<script lang="ts">
    import InteractiveMap from "$lib/components/InteractiveMap.svelte";
    import QuestionPrompter from "$lib/components/QuestionPrompter.svelte";
    import { hungaryMapInfo } from "$lib/mapInfo";
    import { playerIdToHungarianName } from "$lib/player";
    import { defaultGuessQuestion } from "$lib/question";
    import { gameStateSchema } from "$lib/state";
    import { gameState } from "$lib/stores";
    import { onMount } from "svelte";
    let questionPrompter: QuestionPrompter;

    onMount(() => {
        let gameStateString = localStorage.getItem("gameState");
        if (gameStateString !== null) {
            $gameState = gameStateSchema.parse(JSON.parse(gameStateString));
        }

        gameState.subscribe((newState) => {
            localStorage.setItem("gameState", JSON.stringify(newState));
        });
    });

    let lastClicked = "";
    let currentPlayer = 0;
    function cycleTurn() {
        currentPlayer = (currentPlayer + 1) % 3;
    }
    function onRegionClicked(index: number) {
        const regionStates = $gameState.regions;
        let regionState = regionStates[index];
        lastClicked = hungaryMapInfo.regions[index].name;
        if (regionState.type === "empty") {
            regionStates[index] = {
                ownerId: currentPlayer,
                type: "normal",
                value: 300,
            };
            $gameState = $gameState;
            cycleTurn();
        } else {
            if (regionState.ownerId === currentPlayer) {
                alert("Ez a sajátod");
            } else {
                questionPrompter.startGuess(
                    defaultGuessQuestion(),
                    [currentPlayer, regionState.ownerId],
                    (order) => {
                        console.log(order);
                        console.log(currentPlayer);
                        if (currentPlayer == order[0]) {
                            console.log("capturing");
                            regionStates[index] = {
                                ownerId: currentPlayer,
                                type: "normal",
                                value: 300,
                            };
                        }
                        $gameState = $gameState;
                        cycleTurn();
                    }
                );
            }
        }
    }
</script>

<InteractiveMap
    {onRegionClicked}
    regionStates={$gameState.regions}
    class="mx-auto w-2/3"
/>
<div>Utoljára elfoglalt megye: {lastClicked}</div>
<div>Jelenlegi játékos: {playerIdToHungarianName(currentPlayer)}</div>

<QuestionPrompter bind:this={questionPrompter} />
