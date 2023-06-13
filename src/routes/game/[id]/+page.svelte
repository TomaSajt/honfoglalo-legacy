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
    import { calcScores } from "$lib/utils";
    import {
        playerIdToHungarianName,
        playerIdToWeakCssColor,
    } from "$lib/player";
    import { page } from "$app/stores";
    import PlayerOrdersBar from "$lib/components/PlayerOrdersBar.svelte";
    import {
        bazisfoglalasPlayerOrder,
        playerOrders,
        handleBazisfoglalas,
        handleFelosztasValasztas,
        handleHaboru,
        handleTerjeszkedesKerdes,
        handleTerjeszkedesValasztas,
        startFelosztasKerdes,
    } from "$lib/game";

    $: localStorageName = "gameState-" + $page.params.id;

    let questionPrompter: QuestionPrompter;

    onMount(() => {
        console.debug("onMount");
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
                handleBazisfoglalas($gameState, index);
                break;
            case "terjeszkedes-valasztas":
                handleTerjeszkedesValasztas($gameState, index);
                break;
            case "terjeszkedes-kerdes":
                alert("Indítsd el a kérdést a folytatáshoz");
                break;
            case "felosztas-kerdes":
                alert("Indítsd el a kérdést a folytatáshoz");
                break;
            case "felosztas-valasztas":
                handleFelosztasValasztas($gameState, index);
                break;
            case "haboru":
                await handleHaboru($gameState, questionPrompter, index);
                break;
            case "game-over":
                alert("A játéknak már vége van");
                break;
        }
        $gameState = $gameState;
        working = false;
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
            <button
                on:click={async () => {
                    await handleTerjeszkedesKerdes(
                        $gameState,
                        questionPrompter
                    );
                    $gameState = $gameState;
                }}
            >
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
            <button
                on:click={async () => {
                    await startFelosztasKerdes($gameState, questionPrompter);
                    $gameState = $gameState;
                }}
            >
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
