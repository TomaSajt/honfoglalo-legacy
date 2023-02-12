<script lang="ts">
    import GuessQuestionInGame from "$lib/components/GuessQuestionInGame.svelte";
    import { defaultGuessQuestion } from "$lib/question";
    let question = defaultGuessQuestion();
    let showQuestion = false;
    function processResults(order: number[]) {
        showQuestion = false;
        console.log(order);
    }
</script>

<button on:click={() => (showQuestion = true)}>start</button>
{#if showQuestion}
    <GuessQuestionInGame
        currentQuestion={question}
        players={[0, 2]}
        onResult={processResults}
    />
{/if}
