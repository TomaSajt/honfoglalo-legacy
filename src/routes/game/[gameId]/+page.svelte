<script lang="ts">
    import InteractiveMap from "$lib/components/InteractiveMap.svelte";
    import PlayerOrdersBar from "$lib/components/PlayerOrdersBar.svelte";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import type { GameState } from "$lib/state";
    import { assert, calcScores, tryJSONParseSchema } from "$lib/utils";
    import {
        playerIdToHungarianName,
        playerIdToStringId,
        playerIdToWeakCssColor,
    } from "$lib/player";
    import { bazisfoglalasPlayerOrder, playerOrders } from "$lib/game";
    import { serverMessageSchema, type ClientMessage } from "$lib/message";
    import ScreenOverlay from "$lib/components/ScreenOverlay.svelte";

    $: apiURL = `/game/${encodeURI($page.params.gameId)}/api`;

    type SelfInfo = {
        clientId: string;
        playerId: number;
        gameState: GameState;
    };

    let selfInfo: SelfInfo | undefined = undefined;

    onMount(() => {
        console.debug("onMount");
        const eventSource = new EventSource(apiURL);

        const onmessage = async (event: MessageEvent<string>) => {
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
                selfInfo = {
                    clientId: msg.id,
                    playerId: msg.playerId,
                    gameState: msg.state,
                };
                return;
            }
            if (msg.type === "show-message") {
                return;
            }
            assert(selfInfo);
            if (msg.type === "heartbeat-request") {
                let res = await sendMessage({
                    type: "heartbeat",
                    clientId: selfInfo.clientId,
                });
                console.log(`Heartbeat response: ${await res.text()}`);
                return;
            }
            if (msg.type === "set-state") {
                selfInfo.gameState = msg.state;
                return;
            }
        };
        const onerror = () => goto("/game");
        eventSource.addEventListener("message", onmessage);
        eventSource.addEventListener("error", onerror);

        return () => {
            eventSource.removeEventListener("message", onmessage);
            eventSource.removeEventListener("error", onerror);
            eventSource.close();
        };
    });

    async function sendMessage(msg: ClientMessage) {
        return await fetch(apiURL, {
            method: "POST",
            body: JSON.stringify(msg),
        });
    }

    async function onRegionClicked(index: number) {
        assert(selfInfo);
        sendMessage({
            type: "interact-region",
            clientId: selfInfo.clientId,
            index,
        });
    }

    const preloadImageUrls = [
        ...[0, 1, 2].flatMap((id) => [
            ...[1, 2, 3].map(
                (rem) => `/fort/${playerIdToStringId(id)}/${rem}.png`
            ),
            `/army/${playerIdToStringId(id)}.svg`,
            `/marker/${playerIdToStringId(id)}.png`,
        ]),
        "/fort/destroyed.png",
    ];
</script>

<svelte:head>
    {#each preloadImageUrls as imageUrl}
        <link rel="preload" as="image" href={imageUrl} />
    {/each}
</svelte:head>

{#if !selfInfo}
    <div class="flex-grow grid place-items-center">Loading...</div>
{:else}
    {@const gameState = selfInfo.gameState}
    {#if gameState.gameProgress.phase === "terjeszkedes-kerdes"}
        <ScreenOverlay>
            <div class="bg-slate-400 rounded-lg p-12">
                <div class="pb-8">{gameState.gameProgress.question}</div>
                <div class="grid grid-cols-2">
                    {#each gameState.gameProgress.options as option, i}
                        <button
                            class="text-center bg-slate-500 hover:bg-slate-600"
                            on:click={() => {
                                assert(selfInfo);
                                sendMessage({
                                    clientId: selfInfo.clientId,
                                    type: "choose-option",
                                    optionIndex: i,
                                });
                            }}
                        >
                            {option}
                        </button>
                    {/each}
                </div>
            </div>
        </ScreenOverlay>
    {/if}

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
        <div>A te színed: {playerIdToHungarianName(selfInfo.playerId)}</div>
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
            <PlayerOrdersBar
                {playerOrders}
                round={gameState.gameProgress.round}
                playerOrderIndex={-1}
            />
        {:else if gameState.gameProgress.phase === "felosztas-kerdes"}
            <div />
        {:else if gameState.gameProgress.phase === "felosztas-valasztas"}
            <div class="text-center">
                {playerIdToHungarianName(gameState.gameProgress.player)} választ
            </div>
        {:else if gameState.gameProgress.phase === "game-over"}
            <div class="text-center text-5xl">Vége a játéknak!</div>
        {/if}
    </div>
{/if}
