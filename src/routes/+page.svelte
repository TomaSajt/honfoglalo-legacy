<script lang="ts">
    let a = [1, 2, 3];
</script>


<div class="h-full flex flex-col">
    <header class="">
        <div class="text-3xl text-center py-7 bg-red-500">Cím</div>
    </header>
    <main class="flex-grow">
        <div class="max-w-2xl min-w-min mx-auto my-4 flex flex-col text-center min-h-full justify-center gap-4">
            <a href="/play">Játék</a>
            <a href="/editor">Kérdéskezelő</a>
        </div>
    </main>
    
    
    <footer class="bg-green-500 py-7">
        készítette valaki
    </footer>
</div>

<style lang="postcss">
    main {
        background-image: url("laci.png");
        background-repeat: no-repeat;
        background-position: center;
        
    }
</style>


<!-- <div class="bg-blue-600 p-5 hover:bg-blue-200 flex justify-evenly">
    {#each a as v}
        <div>{v}</div>
    {/each}
</div> -->
