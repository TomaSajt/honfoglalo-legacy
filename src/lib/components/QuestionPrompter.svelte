<script lang="ts">
    import GuessQuestionInGame from "$lib/components/GuessQuestionInGame.svelte";
    import ScreenOverlay from "$lib/components/ScreenOverlay.svelte";
    import {
        defaultChoiceQuestion,
        defaultGuessQuestion,
        type ChoiceQuestion,
        type GuessQuestion,
    } from "$lib/question";
    import { tick } from "svelte";
    import ChoiceQuestionInGame from "./ChoiceQuestionInGame.svelte";

    let currentChoiceQuestion = defaultChoiceQuestion();
    let currentGuessQuestion = defaultGuessQuestion();
    let isChoiceQuestion = false;

    let showQuestion = false;

    let players: number[] = [];
    let guessResultCallback: (order: number[]) => void = () => {};
    let choiceResultCallback: (correctPlayers: number[]) => void = () => {};

    export function startChoice(
        question: ChoiceQuestion,
        playerList: number[]
    ) {
        currentChoiceQuestion = question;
        players = playerList;
        isChoiceQuestion = true;
        showQuestion = true;
        return new Promise<number[]>((res) => (choiceResultCallback = res));
    }

    export function startGuess(question: GuessQuestion, playerList: number[]) {
        currentGuessQuestion = question;
        players = playerList;
        isChoiceQuestion = false;
        showQuestion = true;
        return new Promise<number[]>((res) => (guessResultCallback = res));
    }
</script>

{#if showQuestion}
    <ScreenOverlay>
        {#if isChoiceQuestion}
            <ChoiceQuestionInGame
                currentQuestion={currentChoiceQuestion}
                {players}
                onResult={async (correct) => {
                    showQuestion = false;
                    await tick();
                    choiceResultCallback(correct);
                }}
            />
        {:else}
            <GuessQuestionInGame
                currentQuestion={currentGuessQuestion}
                {players}
                onResult={async (order) => {
                    showQuestion = false;
                    await tick();
                    guessResultCallback(order);
                }}
            />
        {/if}
    </ScreenOverlay>
{/if}
