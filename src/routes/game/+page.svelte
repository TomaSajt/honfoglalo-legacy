<script lang="ts">
    import { goto } from "$app/navigation";
    let newGameId: string = "";


    function joinGame(id: string) {
        goto(`/game/${encodeURI(id)}`);
    }
</script>

<div class="py-8 text-3xl text-center">Folyamatban lévő játékok</div>
<div class="flex w-4/5 mx-auto gap-2 flex-wrap justify-center">
    <div>itt nincs semmi :(</div>
</div>
<div class="pt-10">
    <div class="flex flex-col gap-4 p-4 border border-black w-fit mx-auto">
        <span class="text-center">Csatlakozás a játékhoz</span>
        <input
            type="text"
            bind:value={newGameId}
            class="outline focus:outline-2 outline-1 rounded outline-slate-900 w-60 text-center"
            placeholder="azonosító"
            on:keydown={(e) => {
                if (e.key === "Enter") joinGame(newGameId);
            }}
        />
        <div class="px-8 pt-2">
            <button
                disabled={newGameId == ""}
                on:click={() => joinGame(newGameId)}
                class="disabled:opacity-50 bg-slate-200 w-full rounded border border-black"
            >
                Kész
            </button>
        </div>
    </div>
</div>
