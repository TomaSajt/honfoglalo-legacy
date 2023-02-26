<script lang="ts">
    import { playerIdToHungarianName } from "$lib/player";
    import type { GuessQuestion } from "$lib/question";
    import { assert } from "$lib/utils";
    import { onMount } from "svelte";

    export let currentQuestion: GuessQuestion;
    export let players: number[];
    export let onResult: (order: number[]) => any;

    let playerAnswers: number[] = Array<number>(players.length).fill(0);
    let remainingTime = currentQuestion.timeLimit;
    let countdownInterval: NodeJS.Timer;

    let resultOrder: number[] | undefined = undefined;
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

    function evaluateResults() {
        let diffPairs: { player: number; diff: number }[] = [];
        for (let i = 0; i < players.length; i++) {
            diffPairs.push({
                player: players[i],
                diff: Math.abs(playerAnswers[i] - currentQuestion.solution),
            });
        }
        diffPairs.sort((a, b) => a.diff - b.diff);
        resultOrder = diffPairs.map((x) => x.player);
    }

    function finish() {
        clearInterval(countdownInterval);
        remainingTime = 0;
        evaluateResults();
    }

    function submitResult() {
        assert(!!resultOrder, "Only call this when resultOrder is not null");
        onResult(resultOrder);
    }
</script>

<div class="p-4 max-w-[40rem] w-full mx-auto">
    <div class="flex flex-col bg-slate-400 p-4 gap-4 rounded-lg">
        <div class="text-center text-lg uppercase font-bold tracking">
            Tippelős kérdés
        </div>
        <div>{currentQuestion.question}</div>
        <div class="flex gap-2">
            <div>Hátralévő idő:</div>
            <div>{remainingTime}</div>
        </div>
        <div class="flex gap-4 justify-evenly">
            {#each players as id, i}
                <div class="flex flex-col items-center w-20">
                    <div>{playerIdToHungarianName(id)}</div>
                    <input
                        class="pl-2 py-2 w-full"
                        type="number"
                        disabled={!!resultOrder}
                        bind:value={playerAnswers[i]}
                    />
                </div>
            {/each}
        </div>
        {#if resultOrder}
            <div>Helyes megoldás: {currentQuestion.solution}</div>
            {#each resultOrder as id, i}
                <div>{i + 1}. hely - {playerIdToHungarianName(id)}</div>
            {/each}
            <button on:click={() => submitResult()}>Befejezés</button>
        {:else}
            <button on:click={() => finish()}>Ellenőrzés</button>
        {/if}
    </div>
</div>
