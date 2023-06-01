<script lang="ts">
    import { goto } from "$app/navigation";
    import { playerIdToStrongCssColor } from "$lib/player";
    import { tryParseState } from "$lib/state";
    import { calcScores, getHungarianGameProgressPhaseName } from "$lib/utils";
    import { onMount } from "svelte";

    let gameIds: string[] = [];
    let newGameId: string = "";

    onMount(() => reloadGameIds());

    function reloadGameIds() {
        gameIds = [];
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i)!;
            if (!key.startsWith("gameState-")) continue;
            gameIds.push(key.substring(10));
        }
    }

    function startGame(id: string) {
        goto(`/game/${encodeURI(id)}`);
    }
</script>

<div class="py-8 text-3xl text-center">Folyamatban lévő játékok</div>
<div class="flex w-4/5 mx-auto gap-2 flex-wrap justify-center">
    {#each gameIds as id}
        {@const res = tryParseState(
            localStorage.getItem("gameState-" + id) ?? ""
        )}
        <div class="w-96 bg-slate-400 p-4 flex flex-col gap-2">
            <div>
                <div class="text-2xl">Játék (Hosszú hadjárat)</div>
                <div>Azonosító: {id}</div>
            </div>

            {#if res.success}
                {@const gameState = res.data}
                {@const startDate = new Date(gameState.startTimestamp)}
                <div class="flex gap-2">
                    {#each calcScores(gameState) as score, i}
                        <div
                            class="py-1 leading-snug"
                            style="background-color: {playerIdToStrongCssColor(
                                i
                            )};"
                        >
                            <div class="bg-slate-300 w-10 text-center">
                                {score}
                            </div>
                        </div>
                    {/each}
                </div>
                <div>
                    <div>
                        Fázis: {getHungarianGameProgressPhaseName(gameState)}
                    </div>
                    <div>
                        Létrehozva: {startDate.toLocaleDateString()}
                    </div>
                </div>
            {:else}
                <div>Hiba a játék betöltésekor</div>
            {/if}
            <div class="flex justify-between">
                <button on:click={() => startGame(id)}>Folytatás</button>
                <button
                    on:click={() => {
                        let res = confirm(
                            "Biztosan véglegesen törli ezt a játékot?"
                        );
                        if (!res) return;
                        localStorage.removeItem("gameState-" + id);
                        reloadGameIds();
                    }}
                >
                    Törlés
                </button>
            </div>
        </div>
    {:else}
        <div>Nincs játék folyamatban!</div>
    {/each}
</div>
<div class="pt-10">
    <div class="flex flex-col gap-4 p-4 border border-black w-fit mx-auto">
        <span class="text-center">Új játék indítása</span>
        <input
            type="text"
            bind:value={newGameId}
            class="outline focus:outline-2 outline-1 rounded outline-slate-900 w-60 text-center"
            placeholder="azonosító"
            on:keydown={(e) => {
                if (e.key === "Enter") startGame(newGameId);
            }}
        />
        <div class="px-8 pt-2">
            <button
                disabled={newGameId == ""}
                on:click={() => startGame(newGameId)}
                class="disabled:opacity-50 bg-slate-200 w-full rounded border border-black"
            >
                Kész
            </button>
        </div>
    </div>
</div>
