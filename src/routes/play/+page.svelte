<script lang="ts">
    import InteractiveMap from "$lib/components/InteractiveMap.svelte";
    import QuestionPrompter from "$lib/components/QuestionPrompter.svelte";
    import {
        defaultGameState,
        gameStateSchema,
        tryParseState,
    } from "$lib/state";
    import { gameState } from "$lib/stores";
    import { onMount } from "svelte";
    import { defaultChoiceQuestion, defaultGuessQuestion } from "$lib/question";
    import { assert, sleep } from "$lib/utils";
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

    $: scores = calcScores($gameState);

    function calcScores(..._: any[]) {
        let scores = [0, 0, 0];
        for (let region of $gameState.regions) {
            if (region.type !== "fort" && region.type !== "normal") continue;
            scores[region.player] += region.value;
        }
        for (let i = 0; i < 2; i++) {
            scores[i] += 100 * $gameState.defendedCounts[i];
        }
        return scores;
    }

    onMount(() => {
        let gameStateString = localStorage.getItem("gameState");
        if (gameStateString !== null) {
            let res = tryParseState(gameStateString);
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

    let working = false;

    async function onRegionClicked(index: number) {
        if (working) {
            alert("A kör még folyamatban van!");
            return;
        }
        working = true;
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
                await handleHaboru(index);
                break;
        }
        working = false;
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

    async function handleHaboru(index: number) {
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
            await startHaboruKerdesNormalFeleletvalasztos(index);
        } else {
            await startHaboruKerdesFortFeleletvalasztos(index);
        }
    }

    async function startTerjeszkedesKerdes() {
        assert($gameState.gameProgress.type === "terjeszkedes-kerdes");
        let correct = await questionPrompter.startChoice(
            defaultChoiceQuestion(),
            [0, 1, 2]
        );
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
            $gameState.regions.filter((x) => x.type === "empty").length < 3;
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

    async function startFelosztasKerdes() {
        assert($gameState.gameProgress.type === "felosztas-kerdes");
        let order = await questionPrompter.startGuess(
            defaultGuessQuestion(),
            [0, 1, 2]
        );
        $gameState.gameProgress = {
            type: "felosztas",
            player: order[0],
        };
    }

    async function startHaboruKerdesNormalFeleletvalasztos(index: number) {
        let region = $gameState.regions[index];
        assert($gameState.gameProgress.type === "haboru");
        assert(region.type === "normal");
        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;
        let attacker = playerOrders[round][playerOrderIndex];
        let defender = region.player;
        let correct = await questionPrompter.startChoice(
            defaultChoiceQuestion(),
            [attacker, defender].sort()
        );
        if (correct.length == 2) {
            await sleep(1000);
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
                $gameState.defendedCounts[defender]++;
            }
        }
        progressHaboru();
    }

    async function startHaboruKerdesNormalTipp(index: number) {
        let region = $gameState.regions[index];
        assert($gameState.gameProgress.type === "haboru");
        assert(region.type === "normal");
        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;
        let attacker = playerOrders[round][playerOrderIndex];
        let defender = region.player;
        let order = await questionPrompter.startGuess(
            defaultGuessQuestion(),
            [attacker, defender].sort()
        );
        let winner = order[0];
        if (winner === attacker) {
            $gameState.regions[index] = {
                type: "normal",
                player: attacker,
                value: 400,
            };
        } else {
            $gameState.defendedCounts[defender]++;
        }
        progressHaboru();
    }

    async function startHaboruKerdesFortFeleletvalasztos(index: number) {
        let region = $gameState.regions[index];
        assert($gameState.gameProgress.type === "haboru");
        assert(region.type === "fort");
        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;
        let attacker = playerOrders[round][playerOrderIndex];
        let defender = region.player;
        let correct = await questionPrompter.startChoice(
            defaultChoiceQuestion(),
            [attacker, defender].sort()
        );
        if (correct.length == 2) {
            await sleep(1000);
            await startHaboruKerdesFortTipp(index);
            return;
        }
        if (correct.length == 1) {
            let winner = correct[0];
            if (winner === attacker) {
                let alreadyDestroyed = region.towersRemaining === 0;
                damageFort(index);
                region = $gameState.regions[index];
                assert(region.type === "fort");
                if (region.towersRemaining > 0) {
                    await sleep(1000);
                    await startHaboruKerdesFortFeleletvalasztos(index);
                    return;
                }
                if (alreadyDestroyed) {
                    $gameState.regions[index] = {
                        ...region,
                        player: attacker,
                    };
                } else {
                    transferRegionOwnerships(defender, attacker);
                }
            } else {
                $gameState.defendedCounts[defender]++;
            }
        }
        progressHaboru();
    }

    function transferRegionOwnerships(fromPlayer: number, toPlayer: number) {
        for (let i = 0; i < $gameState.regions.length; i++) {
            let region = $gameState.regions[i];
            if (region.type !== "normal" && region.type !== "fort") continue;
            if (region.player !== fromPlayer) continue;
            $gameState.regions[i] = {
                ...region,
                player: toPlayer,
            };
        }
    }

    async function startHaboruKerdesFortTipp(index: number) {
        let region = $gameState.regions[index];
        assert($gameState.gameProgress.type === "haboru");
        assert(region.type === "fort");
        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;
        let attacker = playerOrders[round][playerOrderIndex];
        let defender = region.player;
        let order = await questionPrompter.startGuess(
            defaultGuessQuestion(),
            [attacker, defender].sort()
        );
        let winner = order[0];
        if (winner === attacker) {
            let alreadyDestroyed = region.towersRemaining === 0;
            damageFort(index);
            region = $gameState.regions[index];
            assert(region.type === "fort");
            if (region.towersRemaining > 0) {
                await sleep(1000);
                await startHaboruKerdesFortFeleletvalasztos(index);
                return;
            }
            if (alreadyDestroyed) {
                $gameState.regions[index] = {
                    ...region,
                    player: attacker,
                };
            } else {
                transferRegionOwnerships(defender, attacker);
            }
        } else {
            $gameState.defendedCounts[defender]++;
        }
        progressHaboru();
    }

    function damageFort(index: number) {
        let region = $gameState.regions[index];
        assert(region.type === "fort");
        let newTowers = Math.max(0, region.towersRemaining - 1);
        $gameState.regions[index] = {
            ...region,
            towersRemaining: newTowers,
        };
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
        assert($gameState.gameProgress.type === "haboru");
        let playersInGame = new Set<number>();
        for (let region of $gameState.regions) {
            if (region.type !== "fort" && region.type !== "normal") continue;
            playersInGame.add(region.player);
        }

        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;
        let player = playerOrders[round][playerOrderIndex];

        if (playersInGame.size < 2) {
            $gameState.gameProgress = {
                type: "game-over",
            };
            return;
        }
        if (playersInGame.has(player)) return;
        progressHaboru();
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

<nav class="px-3 pt-3">
    <a class="bg-white hover:bg-slate-300" href="/">Főmenü</a>
</nav>

<div class="flex justify-evenly">
    {#each scores as score, i}
        <div>{playerIdToHungarianName(i)}: {score}</div>
    {/each}
</div>

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
