<script lang="ts">
    import { onMount } from "svelte";

    export let players: number[];
    export let onResult: (correctPlayers: number[]) => void;
    let order = [...players];

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

    function swapOrder(i: number, j: number) {
        [order[i], order[j]] = [order[j], order[i]];
    }
    function skipTimer() {
        clearInterval(countdownInterval);
        remainingTime = 0;
    }
</script>

<div class="p-4 max-w-[40rem] w-full mx-auto">
    <div class="flex flex-col bg-slate-400 p-4 gap-4 rounded-lg">
        <div class="text-center text-lg uppercase font-bold tracking">
            Tippelős kérdés
        </div>
        <div class="flex gap-2">
            <div>Hátralévő idő:</div>
            <div>{remainingTime}</div>
        </div>
        {#if remainingTime > 0}
            <button on:click={() => skipTimer()}>Időzítő kihagyása</button>
        {:else}
            <div class="flex flex-col">
                {#each order as player, i}
                    <div class="flex">
                        <div class="flex-grow">{player}</div>
                        {#if i > 0}
                            <button on:click={() => swapOrder(i, i - 1)}>
                                Move up
                            </button>
                        {/if}
                    </div>
                {/each}
            </div>
            <button on:click={() => onResult(order)}>Befejezés</button>
        {/if}
    </div>
</div>
