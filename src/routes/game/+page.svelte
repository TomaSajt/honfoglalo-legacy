<script lang="ts">
    import { navigating, page } from "$app/stores";
    import { gameState } from "$lib/stores";
    import { onMount } from "svelte";

    let gameIds: string[] = [];

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
        {/each}
    </div>
    <div class="text-center pt-10">Új játék indításához egészítsd ki a linket egy játékazonosítóval: /game/azonosito</div>
</div>
