<script lang="ts">
    import GuessQuestionInGame from "$lib/components/GuessQuestionPrompt.svelte";
    import ScreenOverlay from "$lib/components/ScreenOverlay.svelte";
    import { tick } from "svelte";
    import ChoiceQuestionInGame from "./ChoiceQuestionPrompt.svelte";

    let isChoiceQuestion = false;

    let showQuestion = false;

    let players: number[] = [];
    let guessResultCallback: (order: number[]) => void = () => {};
    let choiceResultCallback: (correctPlayers: number[]) => void = () => {};

    export function startChoice(playerList: number[]) {
        players = playerList;
        isChoiceQuestion = true;
        showQuestion = true;
        return new Promise<number[]>((res) => (choiceResultCallback = res));
    }

    export function startGuess(playerList: number[]) {
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
                {players}
                onResult={async (correct) => {
                    showQuestion = false;
                    await tick();
                    choiceResultCallback(correct);
                }}
            />
        {:else}
            <GuessQuestionInGame
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
