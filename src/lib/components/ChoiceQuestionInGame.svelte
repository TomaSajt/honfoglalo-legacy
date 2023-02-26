<script lang="ts">
    import {
        playerIdToStrongCssColor,
        playerIdToWeakCssColor,
    } from "$lib/player";
    import type { ChoiceQuestion } from "$lib/question";
    import { assert } from "$lib/utils";
    import { onMount } from "svelte";

    export let currentQuestion: ChoiceQuestion;
    export let players: number[];
    export let onResult: (correctPlayers: number[]) => any;

    let playerAnswers: number[] = Array<number>(players.length).fill(-1);
    let remainingTime = currentQuestion.timeLimit;
    let countdownInterval: NodeJS.Timer;

    let resultCorrectPlayers: number[] | undefined = undefined;

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
        let correct: number[] = [];
        for (let i = 0; i < players.length; i++) {
            if (playerAnswers[i] === currentQuestion.correctIndex) {
                correct.push(players[i]);
            }
        }
        resultCorrectPlayers = correct;
    }

    function finish() {
        clearInterval(countdownInterval);
        remainingTime = 0;
        evaluateResults();
    }

    function submitResult() {
        assert(
            !!resultCorrectPlayers,
            "Only call this when resultOrder is not null"
        );
        onResult(resultCorrectPlayers);
    }

    function questionIndexToLetter(index: number) {
        return "ABCD"[index];
    }
</script>

<div class="p-4 max-w-[40rem] w-full mx-auto">
    <div class="flex flex-col bg-slate-400 p-4 gap-4 rounded-lg">
        <div class="text-center text-lg uppercase font-bold tracking">
            Tippelős kérdés
        </div>
        <div class="text-center">{currentQuestion.question}</div>
        <div class="flex gap-2">
            <div>Hátralévő idő:</div>
            <div>{remainingTime}</div>
        </div>

        <div class="grid grid-cols-2 gap-x-4 gap-y-2">
            {#each currentQuestion.options as option, i}
                {@const correct = currentQuestion.correctIndex === i}
                {@const showCorrect = !!resultCorrectPlayers}
                <div
                    class="bg-gray-300"
                    class:outline={showCorrect}
                    class:outline-green-800={showCorrect && correct}
                    class:outline-red-800={showCorrect && !correct}
                >
                    <div class="text-center">
                        {questionIndexToLetter(i)}: {option}
                    </div>
                    <div
                        class="grid"
                        style="grid-template-columns: repeat({players.length}, minmax(0, 1fr));"
                    >
                        {#each players as player, j}
                            {@const selected = playerAnswers[j] === i}
                            <button
                                class="h-6"
                                style="background-color: {selected
                                    ? playerIdToStrongCssColor(player)
                                    : playerIdToWeakCssColor(player)};"
                                on:click={() => (playerAnswers[j] = i)}
                            />
                        {/each}
                    </div>
                </div>
            {/each}
        </div>

        {#if resultCorrectPlayers}
            <button on:click={() => submitResult()}>Befejezés</button>
        {:else}
            <button on:click={() => finish()}>Ellenőrzés</button>
        {/if}
    </div>
</div>
