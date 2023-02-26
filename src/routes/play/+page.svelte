<script lang="ts">
    import InteractiveMap from "$lib/components/InteractiveMap.svelte";
    import QuestionPrompter from "$lib/components/QuestionPrompter.svelte";
    import { defaultGameState, gameStateSchema } from "$lib/state";
    import { gameState } from "$lib/stores";
    import { onMount } from "svelte";
    import { defaultChoiceQuestion, defaultGuessQuestion } from "$lib/question";
    import { assert } from "$lib/utils";
    import {
        playerIdToHungarianName,
        playerIdToStrongCssColor,
        playerIdToWeakCssColor,
    } from "$lib/player";
    import { getRegionIndexFromId, hungaryMapInfo } from "$lib/mapInfo";

    let questionPrompter: QuestionPrompter;

    let playerOrders = [
        [0, 1, 2],
        [1, 2, 0],
        [2, 0, 1],
        [0, 2, 1],
        [1, 0, 2],
        [2, 1, 0],
    ];

    onMount(() => {
        let gameStateString = localStorage.getItem("gameState");
        if (gameStateString !== null) {
            let res = gameStateSchema.safeParse(JSON.parse(gameStateString));
            if (res.success) $gameState = res.data;
            else alert("Hiba a játék betöltsése során: " + res.error);
        }

        gameState.subscribe((newState) => {
            let res = gameStateSchema.safeParse(newState);
            if (res.success) {
                localStorage.setItem("gameState", JSON.stringify(newState));
            } else {
                alert("Hibás játékállapot: " + res.error);
            }
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
            case "felosztas-kerdes":
                alert("Indítsd el a kérdést a folytatáshoz");
                break;
            case "felosztas":
                handleFelosztas(index);
                break;
            case "haboru":
                handleHaboru(index);
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
            player: currentPlayer,
            type: "fort",
            towersRemaining: 3,
            value: 1000,
        };
        if ($gameState.gameProgress.player === 2) {
            $gameState.gameProgress = {
                type: "terjeszkedes",
                playerOrderIndex: 0,
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
        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;

        let player = playerOrders[round][playerOrderIndex];
        let neigbourIndices = getPlayerReachableRegionIndices(player);
        let bypassNeighbourConstraint =
            neigbourIndices.filter(
                (i) => $gameState.regions[i].type === "empty"
            ).length === 0;
        if (!bypassNeighbourConstraint && !neigbourIndices.includes(index)) {
            alert(
                "Csak az elfoglalt területeddel szomszédos vármegyéket jelölhetsz meg"
            );
            return;
        }
        $gameState.regions[index] = {
            type: "marked",
            player: player,
        };
        if ($gameState.gameProgress.playerOrderIndex < 2) {
            $gameState.gameProgress.playerOrderIndex++;
        } else {
            $gameState.gameProgress = {
                type: "terjeszkedes-kerdes",
                round: $gameState.gameProgress.round,
            };
        }
    }

    function handleFelosztas(index: number) {
        assert($gameState.gameProgress.type === "felosztas");
        if ($gameState.regions[index].type !== "empty") {
            alert("Csak szabad vármegyéket jelölhetsz meg");
            return;
        }

        let player = $gameState.gameProgress.player;
        let neigbourIndices = getPlayerReachableRegionIndices(player);
        let bypassNeighbourConstraint =
            neigbourIndices.filter(
                (i) => $gameState.regions[i].type === "empty"
            ).length === 0;
        if (!bypassNeighbourConstraint && !neigbourIndices.includes(index)) {
            alert(
                "Csak az elfoglalt területeddel szomszédos vármegyéket jelölhetsz meg"
            );
            return;
        }

        $gameState.regions[index] = {
            type: "normal",
            value: 300,
            player: player,
        };

        if ($gameState.regions.filter((x) => x.type === "empty").length !== 0) {
            $gameState.gameProgress = {
                type: "felosztas-kerdes",
            };
        } else {
            $gameState.gameProgress = {
                type: "haboru",
                playerOrderIndex: 0,
                round: 0,
            };
        }
    }

    function handleHaboru(index: number) {
        let region = $gameState.regions[index];
        assert($gameState.gameProgress.type === "haboru");
        assert(region.type === "normal" || region.type === "fort");
        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;
        let player = playerOrders[round][playerOrderIndex];

        let neigbourIndices = getPlayerReachableRegionIndices(player);

        if (!neigbourIndices.includes(index)) {
            alert(
                "Csak az elfoglalt területeddel szomszédos vármegyéket támadhatodmeg"
            );
            return;
        }
        if (region.player === player) {
            alert("Csak más által birtokolt területet támadhatsz meg");
            return;
        }

        if (region.type === "normal") {
            startHaboruKerdesNormalFeleletvalasztos(index);
        } else {
            startHaboruKerdesFortFeleletvalasztos(index);
        }
    }

    function handleHaboruNormal(index: number) {
        startHaboruKerdesNormalFeleletvalasztos(index);
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
                    if (correct.includes(region.player)) {
                        $gameState.regions[i] = {
                            type: "normal",
                            player: region.player,
                            value: 200,
                        };
                    } else {
                        $gameState.regions[i] = {
                            type: "empty",
                        };
                    }
                }
                let skipToFelosztas =
                    $gameState.regions.filter((x) => x.type === "empty")
                        .length < 3;
                if (!skipToFelosztas && $gameState.gameProgress.round < 5) {
                    $gameState.gameProgress = {
                        type: "terjeszkedes",
                        playerOrderIndex: 0,
                        round: $gameState.gameProgress.round + 1,
                    };
                } else {
                    $gameState.gameProgress = {
                        type: "felosztas-kerdes",
                    };
                }
            }
        );
    }

    function startFelosztasKerdes() {
        assert($gameState.gameProgress.type === "felosztas-kerdes");
        questionPrompter.startGuess(
            defaultGuessQuestion(),
            [0, 1, 2],
            (order) => {
                assert($gameState.gameProgress.type === "felosztas-kerdes");
                $gameState.gameProgress = {
                    type: "felosztas",
                    player: order[0],
                };
            }
        );
    }

    function startHaboruKerdesNormalFeleletvalasztos(index: number) {
        let region = $gameState.regions[index];
        assert($gameState.gameProgress.type === "haboru");
        assert(region.type === "normal");
        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;
        let attacker = playerOrders[round][playerOrderIndex];
        let defender = region.player;
        questionPrompter.startChoice(
            defaultChoiceQuestion(),
            [attacker, defender].sort(),
            (correct) => {
                assert($gameState.gameProgress.type === "haboru");
                if (correct.length == 2) {
                    startHaboruKerdesNormalTipp(index);
                    return;
                }
                if (correct.length == 1) {
                    let winner = correct[0];
                    if (winner === attacker) {
                        $gameState.regions[index] = {
                            type: "normal",
                            player: attacker,
                            value: 400,
                        };
                    } else {
                        // TODO: add bonus 100 score to defender
                    }
                }
                progressHaboru();
            }
        );
    }

    function startHaboruKerdesNormalTipp(index: number) {
        let region = $gameState.regions[index];
        assert($gameState.gameProgress.type === "haboru");
        assert(region.type === "normal");
        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;
        let attacker = playerOrders[round][playerOrderIndex];
        let defender = region.player;
        questionPrompter.startGuess(
            defaultGuessQuestion(),
            [attacker, defender].sort(),
            (order) => {
                assert($gameState.gameProgress.type === "haboru");
                let winner = order[0];
                if (winner === attacker) {
                    $gameState.regions[index] = {
                        type: "normal",
                        player: attacker,
                        value: 400,
                    };
                } else {
                    // TODO: add bonus 100 score to defender
                }
                progressHaboru();
            }
        );
    }

    function startHaboruKerdesFortFeleletvalasztos(index: number) {
        let region = $gameState.regions[index];
        assert($gameState.gameProgress.type === "haboru");
        assert(region.type === "fort");
        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;
        let attacker = playerOrders[round][playerOrderIndex];
        let defender = region.player;
        questionPrompter.startChoice(
            defaultChoiceQuestion(),
            [attacker, defender].sort(),
            (correct) => {
                assert($gameState.gameProgress.type === "haboru");
                assert(region.type === "fort");
                if (correct.length == 2) {
                    startHaboruKerdesFortTipp(index);
                    return;
                }
                if (correct.length == 1) {
                    let winner = correct[0];
                    if (winner === attacker) {
                        if (region.towersRemaining > 1) {
                            $gameState.regions[index] = {
                                type: "fort",
                                player: defender,
                                towersRemaining: region.towersRemaining - 1,
                                value: 1000,
                            };
                            startHaboruKerdesFortFeleletvalasztos(index);
                            return;
                        } else {
                            $gameState.regions[index] = {
                                type: "fort",
                                player: attacker,
                                towersRemaining: 0,
                                value: 1000,
                            };
                        }
                    } else {
                        // TODO: add bonus 100 score to defender
                    }
                }
                progressHaboru();
            }
        );
    }

    function startHaboruKerdesFortTipp(index: number) {
        let region = $gameState.regions[index];
        assert($gameState.gameProgress.type === "haboru");
        assert(region.type === "fort");
        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;
        let attacker = playerOrders[round][playerOrderIndex];
        let defender = region.player;
        questionPrompter.startGuess(
            defaultGuessQuestion(),
            [attacker, defender].sort(),
            (order) => {
                assert($gameState.gameProgress.type === "haboru");
                assert(region.type === "fort");
                let winner = order[0];
                if (winner === attacker) {
                    if (region.towersRemaining > 1) {
                        $gameState.regions[index] = {
                            type: "fort",
                            player: defender,
                            towersRemaining: region.towersRemaining - 1,
                            value: 1000,
                        };
                        startHaboruKerdesFortFeleletvalasztos(index);
                        return;
                    } else {
                        $gameState.regions[index] = {
                            type: "fort",
                            player: attacker,
                            towersRemaining: 0,
                            value: 1000,
                        };
                    }
                } else {
                    // TODO: add bonus 100 score to defender
                }
                progressHaboru();
            }
        );
    }

    function progressHaboru() {
        assert($gameState.gameProgress.type === "haboru");
        if ($gameState.gameProgress.playerOrderIndex < 2)
            $gameState.gameProgress.playerOrderIndex++;
        else {
            $gameState.gameProgress.playerOrderIndex = 0;
            if ($gameState.gameProgress.round < 5)
                $gameState.gameProgress.round++;
            else {
                $gameState.gameProgress = {
                    type: "game-over",
                };
            }
        }
    }

    function getPlayerReachableRegionIndices(player: number) {
        function getNeighbourIndices(index: number) {
            let regionInfo = hungaryMapInfo.regions[index];
            return regionInfo.neighbours.map((id) => getRegionIndexFromId(id));
        }

        let playerRegionIndices: number[] = [];
        for (let i = 0; i < hungaryMapInfo.regions.length; i++) {
            let regionState = $gameState.regions[i];
            if (regionState.type !== "fort" && regionState.type !== "normal")
                continue;
            if (regionState.player !== player) continue;
            playerRegionIndices.push(i);
        }
        let neighbourIndicesSet = new Set(
            playerRegionIndices.flatMap((i) => [i, ...getNeighbourIndices(i)])
        );
        return [...neighbourIndicesSet];
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
            Kérdés indítása (terjeszkedés)
        </button>
    </div>
{/if}

{#if $gameState.gameProgress.type === "felosztas-kerdes"}
    <div class="flex justify-center">
        <button on:click={() => startFelosztasKerdes()}>
            Kérdés indítása (felosztás)
        </button>
    </div>
{/if}

{#if $gameState.gameProgress.type === "felosztas"}
    <div class="text-center">
        {playerIdToHungarianName($gameState.gameProgress.player)} választ
    </div>
{/if}

{#if $gameState.gameProgress.type === "terjeszkedes" || $gameState.gameProgress.type === "terjeszkedes-kerdes" || $gameState.gameProgress.type === "haboru"}
    <div class="flex gap-2 justify-center">
        {#each playerOrders as order, i}
            <div
                class="flex outline-black -outline-offset-1 outline-2"
                class:outline={$gameState.gameProgress.round === i}
            >
                {#each order as player, j}
                    {@const isCurrent =
                        $gameState.gameProgress.round === i &&
                        $gameState.gameProgress.type !==
                            "terjeszkedes-kerdes" &&
                        $gameState.gameProgress.playerOrderIndex === j}
                    <div
                        class="w-4 h-4"
                        style="background-color: {isCurrent
                            ? playerIdToStrongCssColor(player)
                            : playerIdToWeakCssColor(player)};"
                    />
                {/each}
            </div>
        {/each}
    </div>
{/if}

<button on:click={() => ($gameState = defaultGameState())}>Újraindítás</button>
<div>$gameState.gameProgress.type: {$gameState.gameProgress.type}</div>
<QuestionPrompter bind:this={questionPrompter} />
