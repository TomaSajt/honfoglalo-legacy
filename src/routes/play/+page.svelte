<script lang="ts">
    import InteractiveMap from "$lib/components/InteractiveMap.svelte";
    import QuestionPrompter from "$lib/components/QuestionPrompter.svelte";
    import { defaultGameState, gameStateSchema } from "$lib/state";
    import { gameState } from "$lib/stores";
    import { onMount } from "svelte";
    import { defaultChoiceQuestion, defaultGuessQuestion } from "$lib/question";
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

    function onRegionClicked(index: number) {
        switch ($gameState.gameProgress.type) {
            case "bazisfoglalas":
                handleBazisfoglalas(index);
                break;
            case "terjeszkedes":
                handleTerjeszkedes(index);
                break;
            case "terjeszkedes-kerdes":
                alert("Indítsd el a kérdést a folytatáshoz");
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
        if ($gameState.gameProgress.player < 2) {
            $gameState.gameProgress.player++;
        } else {
            $gameState.gameProgress = {
                type: "terjeszkedes-kerdes",
                round: $gameState.gameProgress.round,
            };
        }
    }

    function startTerjeszkedesKerdes() {
        assert($gameState.gameProgress.type === "terjeszkedes-kerdes");
        questionPrompter.startChoice(
            defaultChoiceQuestion(),
            [0, 1, 2],
            (correct) => {
                assert($gameState.gameProgress.type === "terjeszkedes-kerdes");
                for (let i = 0; i < $gameState.regions.length; i++) {
                    let region = $gameState.regions[i];
                    if (region.type !== "marked") continue;
                    if (correct.includes(region.ownerId)) {
                        $gameState.regions[i] = {
                            type: "normal",
                            ownerId: region.ownerId,
                            value: 200,
                        };
                    } else {
                        $gameState.regions[i] = {
                            type: "empty",
                        };
                    }
                }
                if ($gameState.gameProgress.round < 5) {
                    $gameState.gameProgress = {
                        type: "terjeszkedes",
                        player: 0,
                        round: $gameState.gameProgress.round + 1,
                    };
                } else {
                    $gameState.gameProgress = {
                        type: "felosztas",
                    };
                }
            }
        );
    }
</script>

<InteractiveMap
    {onRegionClicked}
    regionStates={$gameState.regions}
    class="mx-auto w-2/3"
/>
{#if $gameState.gameProgress.type === "terjeszkedes-kerdes"}
    <div class="flex justify-center">
        <button on:click={() => startTerjeszkedesKerdes()}>
            Kérdés indítása
        </button>
    </div>
{/if}
<button on:click={() => ($gameState = defaultGameState())}>Újraindítás</button>
<div>$gameState.gameProgress.type: {$gameState.gameProgress.type}</div>
<QuestionPrompter bind:this={questionPrompter} />
