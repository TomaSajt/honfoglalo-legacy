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
    let guessResultCallback: (order: number[]) => any = () => {};
    let choiceResultCallback: (correctPlayers: number[]) => any = () => {};

    export function startChoice(
        question: ChoiceQuestion,
        playerList: number[],
        cb: (correctPlayers: number[]) => any = () => {}
    ) {
        currentChoiceQuestion = question;
        players = playerList;
        choiceResultCallback = cb;
        isChoiceQuestion = true;
        showQuestion = true;
    }

    export function startGuess(
        question: GuessQuestion,
        playerList: number[],
        cb: (order: number[]) => any
    ) {
        currentGuessQuestion = question;
        players = playerList;
        guessResultCallback = cb;
        isChoiceQuestion = false;
        showQuestion = true;
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
