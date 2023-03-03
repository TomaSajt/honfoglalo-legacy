<script lang="ts">
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

    function toggleCorrect(player: number) {
        correct = correct.includes(player)
            ? correct.filter((p) => p != player)
            : [...correct, player];
    }

    function skipTimer() {
        clearInterval(countdownInterval);
        remainingTime = 0;
    }
</script>

<div class="p-4 max-w-[40rem] w-full mx-auto">
    <div class="flex flex-col bg-slate-400 p-4 gap-4 rounded-lg">
        <div class="text-center text-lg uppercase font-bold tracking">
            Feleletválasztós kérdés
        </div>
        <div class="flex gap-2">
            <div>Hátralévő idő:</div>
            <div>{remainingTime}</div>
        </div>
        {#if remainingTime > 0}
            <button on:click={() => skipTimer()}>Időzítő kihagyása</button>
        {:else}
            <div class="flex flex-col">
                {#each players as player}
                    <div class="flex">
                        <div class="flex-grow">{player}</div>
                        <button on:click={() => toggleCorrect(player)}>
                            Toggle correct
                        </button>
                    </div>
                {/each}
            </div>
            <button on:click={() => onResult(correct)}>Befejezés</button>
        {/if}
    </div>
</div>
