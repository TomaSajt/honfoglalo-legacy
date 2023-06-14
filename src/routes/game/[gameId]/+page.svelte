<script lang="ts">
    import InteractiveMap from "$lib/components/InteractiveMap.svelte";
    import QuestionPrompter from "$lib/components/QuestionPrompter.svelte";
    import { makeEmptyGameState } from "$lib/state";
    import { onMount } from "svelte";
    import { calcScores, tryJSONParseSchema } from "$lib/utils";
    import {
        playerIdToHungarianName,
        playerIdToWeakCssColor,
    } from "$lib/player";
    import { page } from "$app/stores";
    import PlayerOrdersBar from "$lib/components/PlayerOrdersBar.svelte";
    import { bazisfoglalasPlayerOrder, playerOrders } from "$lib/game";
    import { serverMessageSchema, type ClientMessage } from "./api/schema";
    import { goto } from "$app/navigation";

    $: apiURL = `/game/${encodeURI($page.params.gameId)}/api`;

    let questionPrompter: QuestionPrompter;

    let clientId = "";

    let myPlayerId = -1;

    let gameState = makeEmptyGameState();

    onMount(() => {
        console.debug("onMount");
        const eventSource = new EventSource(apiURL);

        const onmessage = async (event: MessageEvent<any>) => {
            console.log(event.data);
            const res = tryJSONParseSchema(serverMessageSchema, event.data);
            if (!res.success) {
                console.error("Malformed event received");
                return;
            }
            const msg = res.data;
            if (msg.type === "back-to-lobby") {
                goto("/game");
                return;
            }
            if (msg.type === "set-identity") {
                clientId = msg.id;
                myPlayerId = msg.playerId;
                return;
            }
            if (msg.type === "heartbeat-request") {
                let res = await sendMessage({
                    type: "heartbeat",
                    clientId: clientId,
                });
                console.log(`Heartbeat response: ${await res.text()}`);
                return;
            }
            if (msg.type === "set-state") {
                gameState = msg.state;
                return;
            }
        };
        eventSource.addEventListener("message", onmessage);

        return () => {
            eventSource.removeEventListener("message", onmessage);
        };
    });

    async function sendMessage(msg: ClientMessage) {
        return await fetch(apiURL, {
            method: "POST",
            body: JSON.stringify(msg),
        });
    }

    async function onRegionClicked(index: number) {
        sendMessage({ type: "interact-region", clientId, index });
    }
</script>

<QuestionPrompter bind:this={questionPrompter} />

<div class="px-4 pt-4">
    <div class="flex justify-evenly">
        {#each calcScores(gameState) as score, i}
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
    regionStates={gameState.regions}
    class="flex-grow min-h-[30%]"
/>
<div class="h-20 pb-4 bg-slate-100 flex flex-col justify-between">
    <div>A te színed: {playerIdToHungarianName(myPlayerId)}</div>
    {#if gameState.gameProgress.phase === "bazisfoglalas"}
        <PlayerOrdersBar
            playerOrders={[bazisfoglalasPlayerOrder]}
            round={0}
            playerOrderIndex={gameState.gameProgress.playerOrderIndex}
        />
    {:else if gameState.gameProgress.phase === "terjeszkedes-valasztas" || gameState.gameProgress.phase === "haboru"}
        <PlayerOrdersBar
            {playerOrders}
            round={gameState.gameProgress.round}
            playerOrderIndex={gameState.gameProgress.playerOrderIndex}
        />
    {:else if gameState.gameProgress.phase === "terjeszkedes-kerdes"}
        <div class="flex justify-center">
            <button
                on:click={async () => {
                    throw "hell naw";
                }}
            >
                Kérdés indítása (terjeszkedés)
            </button>
        </div>
        <PlayerOrdersBar
            {playerOrders}
            round={gameState.gameProgress.round}
            playerOrderIndex={-1}
        />
    {:else if gameState.gameProgress.phase === "felosztas-kerdes"}
        <div class="flex justify-center">
            <button
                on:click={async () => {
                    throw "hell naw";
                }}
            >
                Kérdés indítása (felosztás)
            </button>
        </div>
    {:else if gameState.gameProgress.phase === "felosztas-valasztas"}
        <div class="text-center">
            {playerIdToHungarianName(gameState.gameProgress.player)} választ
        </div>
    {:else if gameState.gameProgress.phase === "game-over"}
        <div class="text-center text-5xl">Vége a játéknak!</div>
    {/if}
</div>
