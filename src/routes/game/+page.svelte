<script lang="ts">
    import { goto } from "$app/navigation";
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
</script>

<div class="flex flex-col h-full">
    <div class="py-8 text-3xl text-center">Folyamatban lévő játékok</div>
    <div class="flex w-4/5 mx-auto gap-2 flex-wrap justify-center">
        {#each gameIds as id}
            <div class="w-96 bg-red-500 p-4">
                <div class="text-2xl">Játék [{id}]</div>
                <div class="flex justify-between pt-4">
                    <a href="/game/{id}">Folytatás</a>
                    <button
                        on:click={() => {
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
            />
            <div class="px-8 pt-2">
                <button
                    disabled={newGameId == ""}
                    on:click={() => goto(`/game/${encodeURI(newGameId)}`)}
                    class="disabled:opacity-50 bg-slate-200 w-full rounded border border-black"
                >
                    Kész
                </button>
            </div>
        </div>
    </div>
</div>
