<script lang="ts">
    import { playerIdToHungarianName } from "$lib/player";
    import { onMount } from "svelte";

    export let players: number[];
    export let onResult: (correctPlayers: number[]) => void;
    let correct: number[] = [];

    let remainingTime = 60;
    let countdownInterval: NodeJS.Timer;

    onMount(() => {
        countdownInterval = setInterval(() => {
            remainingTime -= 1;
            if (remainingTime > 0) return;
            clearInterval(countdownInterval);
        }, 1000);

        return () => {
            clearInterval(countdownInterval);
        };
    });

    function skipTimer() {
        clearInterval(countdownInterval);
        remainingTime = 0;
    }
</script>

<div class="p-4 max-w-[30rem] w-full mx-auto">
    <div class="flex flex-col bg-slate-400 p-4 gap-4 rounded-lg">
        <div class="text-center text-lg uppercase font-bold tracking">
            Feleletválasztós kérdés
        </div>
        <div class="flex gap-2 justify-center">
            <div>Hátralévő idő:</div>
            <div>{remainingTime}</div>
        </div>
        {#if remainingTime > 0}
            <button class="text-center" on:click={() => skipTimer()}>
                Időzítő kihagyása
            </button>
        {:else}
            <div class="grid grid-cols-2 w-1/2 mx-auto text-center">
                {#each players as player}
                    <div>
                        {playerIdToHungarianName(player)}
                    </div>
                    {#if correct.includes(player)}
                        <button
                            on:click={() =>
                                (correct = correct.filter((p) => p != player))}
                        >
                            ✅
                        </button>
                    {:else}
                        <button
                            on:click={() => (correct = [player, ...correct])}
                        >
                            ❌
                        </button>
                    {/if}
                {/each}
            </div>
            <button on:click={() => onResult(correct)}>Befejezés</button>
        {/if}
    </div>
</div>
