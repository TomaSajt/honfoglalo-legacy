<script lang="ts">
    import GuessQuestionInGame from "$lib/components/GuessQuestionInGame.svelte";
    import ScreenOverlay from "$lib/components/ScreenOverlay.svelte";
    import { defaultGuessQuestion } from "$lib/question";
    let question = defaultGuessQuestion();
    let showQuestion = false;
    function processResults(order: number[]) {
        showQuestion = false;
        console.log(order);
    }

    const players = [0, 1, 2];

    function startGuess() {
        showQuestion = true;
    }
</script>

<button on:click={() => startGuess()}>start</button>
{#if showQuestion}
    <ScreenOverlay>
        <GuessQuestionInGame
            currentQuestion={question}
            {players}
            onResult={processResults}
        />
    </ScreenOverlay>
{/if}
