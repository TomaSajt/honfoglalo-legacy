<script lang="ts">
    import InteractiveMap from "$lib/components/InteractiveMap.svelte";
    import QuestionPrompter from "$lib/components/QuestionPrompter.svelte";
    import { hungaryMapInfo } from "$lib/mapInfo";
    import { defaultGameState, gameStateSchema } from "$lib/state";
    import { gameState } from "$lib/stores";
    import { onMount } from "svelte";
    import { defaultGuessQuestion } from "$lib/question";
    import { assert } from "$lib/utils";
    let questionPrompter: QuestionPrompter;

    onMount(() => {
        let gameStateString = localStorage.getItem("gameState");
        if (gameStateString !== null) {
            let res = gameStateSchema.safeParse(JSON.parse(gameStateString));
            if (res.success) $gameState = res.data;
            else alert("Hiba a játék betöltsése során: " + res.error);
        }

        gameState.subscribe((newState) => {
            localStorage.setItem("gameState", JSON.stringify(newState));
        });
    });

    let lastClicked = "";

    function onRegionClicked(index: number) {
        lastClicked = hungaryMapInfo.regions[index].name;
        switch ($gameState.gameProgress.type) {
            case "bazisfoglalas":
                handleBazisfoglalas(index);
                break;
            case "terjeszkedes":
                handleTerjeszkedes(index);
                break;
            case "felosztas":
                break;
            case "haboru":
                break;
        }
    }

    function handleBazisfoglalas(index: number) {
        assert($gameState.gameProgress.type === "bazisfoglalas");
        if ($gameState.regions[index].type !== "empty") {
            alert("Csak szabad vármegyéket foglalhatsz el");
            return;
        }
        let currentPlayer = $gameState.gameProgress.player;
        $gameState.regions[index] = {
            ownerId: currentPlayer,
            type: "fort",
            towersRemaining: 3,
            value: 1000,
        };
        if ($gameState.gameProgress.player === 2) {
            $gameState.gameProgress = {
                type: "terjeszkedes",
                player: 0,
                round: 0,
            };
        } else {
            $gameState.gameProgress.player++;
        }
    }

    function handleTerjeszkedes(index: number) {
        assert($gameState.gameProgress.type === "terjeszkedes");
        if ($gameState.regions[index].type !== "empty") {
            alert("Csak szabad vármegyéket jelölhetsz meg");
            return;
        }
        $gameState.regions[index] = {
            type: "marked",
            ownerId: $gameState.gameProgress.player,
        };
        // TODO: make sure that if the page reloads after having selected all the regions but before answering the question, show another question upon reload
        if ($gameState.gameProgress.player === 2) {
            questionPrompter.startGuess(
                defaultGuessQuestion(),
                [0, 1, 2],
                (order) => {
                    assert($gameState.gameProgress.type === "terjeszkedes");
                    for (let i = 0; i < $gameState.regions.length; i++) {
                        let region = $gameState.regions[i];
                        if (region.type !== "marked") continue;
                        let player = region.ownerId;
                        $gameState.regions[i] = {
                            type: "normal",
                            ownerId: player,
                            value: 200,
                        };
                        $gameState.gameProgress.player = 0;
                        $gameState.gameProgress.round++;
                    }
                }
            );
        } else {
            $gameState.gameProgress.player++;
        }
    }

    /*
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
    }*/
</script>

<InteractiveMap
    {onRegionClicked}
    regionStates={$gameState.regions}
    class="mx-auto w-2/3"
/>
<div>Utoljára kattintott megye: {lastClicked}</div>
<button on:click={() => ($gameState = defaultGameState())}>Újraindítás</button>
<QuestionPrompter bind:this={questionPrompter} />
