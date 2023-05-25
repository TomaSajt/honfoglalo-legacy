<script lang="ts">
    import GuessQuestionInGame from "$lib/components/GuessQuestionPrompt.svelte";
    import ScreenOverlay from "$lib/components/ScreenOverlay.svelte";
    import { sleep } from "$lib/utils";
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
                    await sleep(100);
                    choiceResultCallback(correct);
                }}
            />
        {:else}
            <GuessQuestionInGame
                {players}
                onResult={async (order) => {
                    showQuestion = false;
                    await tick();
                    await sleep(100);
                    guessResultCallback(order);
                }}
            />
        {/if}
    </ScreenOverlay>
{/if}
