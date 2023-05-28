<script lang="ts">
    import InteractiveMap from "$lib/components/InteractiveMap.svelte";
    import QuestionPrompter from "$lib/components/QuestionPrompter.svelte";
    import {
        makeEmptyGameState,
        gameStateSchema,
        tryParseState,
    } from "$lib/state";
    import { gameState } from "./state-store";
    import { onMount } from "svelte";
    import { assert, calcScores, sleep } from "$lib/utils";
    import {
        playerIdToHungarianName,
        playerIdToWeakCssColor,
    } from "$lib/player";
    import { getRegionIndexFromId, hungaryMapInfo } from "$lib/mapInfo";
    import { page } from "$app/stores";
    import PlayerOrdersBar from "$lib/components/PlayerOrdersBar.svelte";

    $: localStorageName = "gameState-" + $page.params.id;

    let questionPrompter: QuestionPrompter;

    let bazisfoglalasPlayerOrder = [0, 1, 2];

    let playerOrders = [
        [0, 1, 2],
        [1, 2, 0],
        [2, 0, 1],
        [0, 2, 1],
        [1, 0, 2],
        [2, 1, 0],
    ];

    onMount(() => {
        console.debug("onMount")
        $gameState = makeEmptyGameState();
        let gameStateString = localStorage.getItem(localStorageName);
        if (gameStateString !== null) {
            let res = tryParseState(gameStateString);
            if (res.success) $gameState = res.data;
            else alert("Hiba a játék betöltsése során: " + res.error);
        }

        let unsubscribe = gameState.subscribe((newState) => {
            let res = gameStateSchema.safeParse(newState);
            if (res.success) {
                localStorage.setItem(
                    localStorageName,
                    JSON.stringify(newState)
                );
            } else {
                alert("Hibás játékállapot: " + res.error);
            }
        });

        return () => unsubscribe();
    });

    let working = false;

    async function onRegionClicked(index: number) {
        if (working) {
            alert("A kör még folyamatban van!");
            return;
        }
        working = true;
        switch ($gameState.gameProgress.phase) {
            case "bazisfoglalas":
                handleBazisfoglalas(index);
                break;
            case "terjeszkedes-valasztas":
                handleTerjeszkedesValasztas(index);
                break;
            case "terjeszkedes-kerdes":
                alert("Indítsd el a kérdést a folytatáshoz");
                break;
            case "felosztas-kerdes":
                alert("Indítsd el a kérdést a folytatáshoz");
                break;
            case "felosztas-valasztas":
                handleFelosztasValasztas(index);
                break;
            case "haboru":
                await handleHaboru(index);
                break;
            case "game-over":
                alert("A játéknak már vége van");
                break;
        }
        working = false;
    }

    function handleBazisfoglalas(index: number) {
        assert($gameState.gameProgress.phase === "bazisfoglalas");
        let neighbourhood = [index, ...getNeighbourIndices(index)];
        if (neighbourhood.some((i) => $gameState.regions[i].type != "empty")) {
            alert(
                "Csak más játékossal nem szomszédos vármegyéket foglalhatsz el"
            );
            return;
        }
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;
        let currentPlayer = bazisfoglalasPlayerOrder[playerOrderIndex];

        $gameState.regions[index] = {
            player: currentPlayer,
            type: "fort",
            towersRemaining: 3,
            value: 1000,
        };
        if ($gameState.gameProgress.playerOrderIndex === 2) {
            $gameState.gameProgress = {
                phase: "terjeszkedes-valasztas",
                playerOrderIndex: 0,
                round: 0,
            };
        } else {
            $gameState.gameProgress.playerOrderIndex++;
        }
    }

    function handleTerjeszkedesValasztas(index: number) {
        assert($gameState.gameProgress.phase === "terjeszkedes-valasztas");
        if ($gameState.regions[index].type !== "empty") {
            alert("Csak szabad vármegyéket jelölhetsz meg");
            return;
        }
        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;

        let player = playerOrders[round][playerOrderIndex];
        let neigbourIndices = getPlayerReachableRegionIndices(player);
        let emptyNeighbourCount = neigbourIndices.filter(
            (i) => $gameState.regions[i].type === "empty"
        ).length;
        if (emptyNeighbourCount !== 0 && !neigbourIndices.includes(index)) {
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
                phase: "terjeszkedes-kerdes",
                round: $gameState.gameProgress.round,
            };
        }
    }

    function handleFelosztasValasztas(index: number) {
        assert($gameState.gameProgress.phase === "felosztas-valasztas");
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
                phase: "felosztas-kerdes",
            };
        } else {
            $gameState.gameProgress = {
                phase: "haboru",
                playerOrderIndex: 0,
                round: 0,
            };
        }
    }

    async function handleHaboru(index: number) {
        let region = $gameState.regions[index];
        assert($gameState.gameProgress.phase === "haboru");
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
        assert($gameState.gameProgress.phase === "terjeszkedes-kerdes");
        let correct = await questionPrompter.startChoice([0, 1, 2]);
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
                phase: "terjeszkedes-valasztas",
                playerOrderIndex: 0,
                round: $gameState.gameProgress.round + 1,
            };
        } else {
            $gameState.gameProgress = {
                phase: "felosztas-kerdes",
            };
        }
    }

    async function startFelosztasKerdes() {
        assert($gameState.gameProgress.phase === "felosztas-kerdes");
        let order = await questionPrompter.startGuess([0, 1, 2]);
        $gameState.gameProgress = {
            phase: "felosztas-valasztas",
            player: order[0],
        };
    }

    async function startHaboruKerdesNormalFeleletvalasztos(index: number) {
        let region = $gameState.regions[index];
        assert($gameState.gameProgress.phase === "haboru");
        assert(region.type === "normal");
        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;
        let attacker = playerOrders[round][playerOrderIndex];
        let defender = region.player;
        let correct = await questionPrompter.startChoice(
            [attacker, defender].sort()
        );
        if (correct.length == 2) {
            await sleep(500);
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
                awardDefendedBonus(defender);
            }
        }
        progressHaboru();
    }

    async function startHaboruKerdesNormalTipp(index: number) {
        let region = $gameState.regions[index];
        assert($gameState.gameProgress.phase === "haboru");
        assert(region.type === "normal");
        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;
        let attacker = playerOrders[round][playerOrderIndex];
        let defender = region.player;
        let order = await questionPrompter.startGuess(
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
            awardDefendedBonus(defender);
        }
        progressHaboru();
    }

    async function startHaboruKerdesFortFeleletvalasztos(index: number) {
        let region = $gameState.regions[index];
        assert($gameState.gameProgress.phase === "haboru");
        assert(region.type === "fort");
        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;
        let attacker = playerOrders[round][playerOrderIndex];
        let defender = region.player;
        let correct = await questionPrompter.startChoice(
            [attacker, defender].sort()
        );
        if (correct.length == 2) {
            await sleep(500);
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
                awardDefendedBonus(defender);
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
        $gameState.defendedCounts[toPlayer] +=
            $gameState.defendedCounts[fromPlayer];
        $gameState.defendedCounts[fromPlayer] = 0;
    }

    async function startHaboruKerdesFortTipp(index: number) {
        let region = $gameState.regions[index];
        assert($gameState.gameProgress.phase === "haboru");
        assert(region.type === "fort");
        let round = $gameState.gameProgress.round;
        let playerOrderIndex = $gameState.gameProgress.playerOrderIndex;
        let attacker = playerOrders[round][playerOrderIndex];
        let defender = region.player;
        let order = await questionPrompter.startGuess(
            [attacker, defender].sort()
        );
        let winner = order[0];
        if (winner === attacker) {
            let alreadyDestroyed = region.towersRemaining === 0;
            damageFort(index);
            region = $gameState.regions[index];
            assert(region.type === "fort");
            if (region.towersRemaining > 0) {
                await sleep(500);
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
            awardDefendedBonus(defender);
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

    function awardDefendedBonus(player: number) {
        $gameState.defendedCounts[player]++;
        $gameState.defendedCounts = $gameState.defendedCounts;
        console.log("awarding bonus");
    }

    function progressHaboru() {
        assert($gameState.gameProgress.phase === "haboru");
        if ($gameState.gameProgress.playerOrderIndex < 2)
            $gameState.gameProgress.playerOrderIndex++;
        else {
            $gameState.gameProgress.playerOrderIndex = 0;
            if ($gameState.gameProgress.round < 5)
                $gameState.gameProgress.round++;
            else {
                $gameState.gameProgress = {
                    phase: "game-over",
                };
            }
        }
        assert($gameState.gameProgress.phase === "haboru");
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
                phase: "game-over",
            };
            return;
        }
        if (playersInGame.has(player)) return;
        progressHaboru();
    }

    function getNeighbourIndices(index: number) {
        let regionInfo = hungaryMapInfo.regions[index];
        return regionInfo.neighbours.map((id) => getRegionIndexFromId(id));
    }

    function getPlayerReachableRegionIndices(player: number) {
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

<QuestionPrompter bind:this={questionPrompter} />

<div class="px-4 pt-4">
    <div class="flex justify-evenly">
        {#each calcScores($gameState) as score, i}
            <div class="rounded border border-black w-24">
                <div
                    class="h-4"
                    style="background-color: {playerIdToWeakCssColor(i)};"
                />
                <div class="text-center">
                    {score} pont
                </div>
                <div
                    class="h-4"
                    style="background-color: {playerIdToWeakCssColor(i)};"
                />
            </div>
        {/each}
    </div>
</div>

<InteractiveMap
    {onRegionClicked}
    regionStates={$gameState.regions}
    class="flex-grow min-h-[30%]"
/>
<div class="h-20 pb-4 bg-slate-100 flex flex-col justify-between">
    {#if $gameState.gameProgress.phase === "bazisfoglalas"}
        <PlayerOrdersBar
            playerOrders={[bazisfoglalasPlayerOrder]}
            round={0}
            playerOrderIndex={$gameState.gameProgress.playerOrderIndex}
        />
    {:else if $gameState.gameProgress.phase === "terjeszkedes-valasztas" || $gameState.gameProgress.phase === "haboru"}
        <PlayerOrdersBar
            {playerOrders}
            round={$gameState.gameProgress.round}
            playerOrderIndex={$gameState.gameProgress.playerOrderIndex}
        />
    {:else if $gameState.gameProgress.phase === "terjeszkedes-kerdes"}
        <div class="flex justify-center">
            <button on:click={() => startTerjeszkedesKerdes()}>
                Kérdés indítása (terjeszkedés)
            </button>
        </div>
        <PlayerOrdersBar
            {playerOrders}
            round={$gameState.gameProgress.round}
            playerOrderIndex={-1}
        />
    {:else if $gameState.gameProgress.phase === "felosztas-kerdes"}
        <div class="flex justify-center">
            <button on:click={() => startFelosztasKerdes()}>
                Kérdés indítása (felosztás)
            </button>
        </div>
    {:else if $gameState.gameProgress.phase === "felosztas-valasztas"}
        <div class="text-center">
            {playerIdToHungarianName($gameState.gameProgress.player)} választ
        </div>
    {:else if $gameState.gameProgress.phase === "game-over"}
        <div class="text-center text-5xl">Vége a játéknak!</div>
    {/if}
</div>
