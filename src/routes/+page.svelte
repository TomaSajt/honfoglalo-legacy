<script>
    import InteractiveMap from "$lib/components/InteractiveMap.svelte";
    import { makeEmptyGameState } from "$lib/state";
</script>

<div class="h-full flex flex-col">
    <header
        class="grid place-items-center h-20 text-3xl bg-red-500 font-bold text-white whitespace-nowrap overflow-x-hidden"
    >
        Réges-régen, egy messzi-messzi játékot lekoppintva
    </header>
    <main
        class="relative flex-grow p-4 flex flex-col items-center gap-2 justify-center"
    >
        <div class="text-7xl pb-10 whitespace-nowrap overflow-x-hidden">Honfoglaló Legacy</div>
        <a
            class="bg-orange-400 hover:bg-slate-200 py-3 w-40 border-2 border-black rounded-xl font-semibold text-center"
            href="/game"
        >
            Játék
        </a>

        <a
            class="bg-orange-400 hover:bg-slate-200 py-3 w-40 border-2 border-black rounded-xl font-semibold text-center"
            href="/settings"
        >
            Beállítások
        </a>
        <div
            class="absolute inset-0 -z-10 opacity-20 flex justify-center p-8 brightness-90"
        >
            <InteractiveMap
                onRegionClicked={() => {}}
                regionStates={makeEmptyGameState().regions}
            />
        </div>
    </main>

    <footer
        class="grid place-items-center h-20 bg-green-500 text-white font-serif whitespace-nowrap overflow-x-hidden"
    >
        <div>
            Készült Magyarország Kormánya megbízásából
            <span title="Valójában nem">*</span>
        </div>
    </footer>
</div>
