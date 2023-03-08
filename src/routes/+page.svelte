<script lang="ts">
    let a = [1, 2, 3];
</script>


<div class="h-full flex flex-col">
    <header class="">
        <div class="text-3xl text-center py-7 bg-red-500 font-bold text-blue-700">Réges régen, egy messzi-messzi játékot lekoppintva</div>
    </header>
    <main class="flex-grow">
        <div class="max-w-2xl min-w-min mx-auto my-4 flex flex-col text-center min-h-full justify-center gap-4">
            <a class="bg-orange-400 hover:bg-slate-200 mx-60 py-4 border-2 border-black rounded-xl font-mono font-semibold" href="/play">Játék</a>
            <a class="bg-orange-400 hover:bg-slate-200 mx-60 py-4 border-2 border-black rounded-xl font-mono font-semibold" href="/settings">Beállítások</a>
        </div>
    </main>
    
    
    <footer class="bg-green-500 py-7 text-white font-serif text-center">
        Készült Magyarország Kormánya megbízásából
    </footer>
</div>

<style lang="postcss">
    main {
        background-image: url("logo.png"), url("laci.png");
        background-size: 40%, 10%;
        background-repeat: no-repeat;
        background-position: center, right 50px top 10px;
    }
</style>


<!-- <div class="bg-blue-600 p-5 hover:bg-blue-200 flex justify-evenly">
    {#each a as v}
        <div>{v}</div>
    {/each}
</div> -->
